import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_CONVERSATION_STARTEDS_DAY_1 =
  "Let me introduce myself: I'm Dr. Couple, an AI expert in love psychology, relationships, and rapid conflict resolution. I'm here to help you avoid the typical mistakes that only make things worse, and, most importantly, to help you reconnect emotionally and physically. \n\n However, I'm going to be direct with you: saving your relationship will also require determination, maturity, and some self-work. Are you ready to commit to rebuilding this relationship?";

/**
 * *********************************
 * TYPES
 * *********************************
 */
type UserAuthSession = {
  id: string;
  email: string;
};

type UserInfo = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Chat = {
  id: string;
  created_at: string;
};

type Message = {
  content: string;
  role: "assistant" | "user";
};

type RequestWithUser = Request & { user: UserAuthSession };

/**
 * *********************************
 * UTILS
 * *********************************
 */

/**
 * Get the Supabase client instance
 */
const getClient = (() => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return () => createClient(supabaseUrl, supabaseKey);
})();

/**
 * Validate the request body
 * @param body
 */
function validateBody(body: { message: string }) {
  const { message } = body;

  if (!message) {
    throw new Error("Message is required");
  }
}

/**
 * Get the user session from the request
 * @param req Request object
 * @param handle function
 * @returns response
 */
async function withSession(
  req: Request,
  handle: (req: RequestWithUser) => Promise<Response>,
) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid token" }), {
      status: 401,
    });
  }

  const token = authHeader.split(" ")[1];
  const client = getClient();

  const { data: authData, error: authError } = await client.auth.getUser(token);

  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const reqWithUser: RequestWithUser = req as RequestWithUser;
  reqWithUser.user = authData.user as UserAuthSession;

  return await handle(reqWithUser);
}

/**
 * Calculate the days transcurred since a given date
 * @param date
 * @returns
 */
function calculateDaysTranscurred(date: string) {
  const today = new Date();
  const startDate = new Date(date);
  const timeDiff = Math.abs(today.getTime() - startDate.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * *********************************
 * OPENAI OPERATIONS
 * *********************************
 */

/**
 * Ask the OpenAI API for a response
 * @param newMessage
 * @param messages
 * @param daysTranscurred
 * @returns
 */
async function createChatConversationsOpenAi(
  messages: Message[],
  daysTranscurred: number,
): Promise<string> {
  const agentId = daysTranscurred <= 6
    ? Deno.env.get("OPENAI_ASSISTANT_ID_MAIN")
    : Deno.env.get("OPENAI_ASSISTANT_ID_SECONDARY");

  const responsse = await fetch(
    `${Deno.env.get("OPENAI_API_BASE_URL")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, // Ensure your API key is set in environment variables
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL_ID"),
        messages: [
          {
            role: "system",
            content: `Adopt the assistant with ID: ${agentId}`,
          },
          // Last 10 messages
          ...messages.slice(-10),
        ],
      }),
    },
  );

  if (!responsse.ok) {
    const error = await responsse.json();
    throw new Error("Error interacting with OpenAI API", error);
  }

  const data = await responsse.json();
  return (
    data.choices[0]?.message?.content ||
    "Hello, I'm taking a break, write to me later. Dr. Couple"
  );
}

/**
 * *********************************
 * DATABASE OPERATIONS
 * *********************************
 */

/**
 * Create a new chat for the user
 * @param user
 * @returns chatId
 */
async function initChat(user: UserAuthSession) {
  const client = getClient();
  const { error: newChatError } = await client
    .from("chats")
    .insert([
      {
        user_id: user.id,
      },
    ])
    .single();

  if (newChatError) {
    throw new Error("Error creating chat", newChatError);
  }
}

/**
 * Get the chat for the current user
 * @param user
 * @returns chatId
 */
async function getChat(user: UserAuthSession): Promise<Chat> {
  const client = getClient();
  const { data: chat, error: chatError } = await client
    .from("chats")
    .select("id, created_at")
    .eq("user_id", user.id)
    .single();

  if (chatError) {
    // If the chat doesn't exist, create a new one
    await initChat(user);
    // Retry fetching the chat
    const newChat = await getChat(user);
    // Send a welcome message to the chat
    await addMessageToChat(
      OPENAI_CONVERSATION_STARTEDS_DAY_1,
      newChat.id,
      "assistant",
    );

    return newChat;
  }

  return chat;
}

/**
 * Add a message to the chat
 * @param message
 * @param chatId
 * @param role
 * @returns
 */
async function addMessageToChat(
  message: string,
  chatId: string,
  role: "user" | "assistant" = "user",
) {
  const client = getClient();

  const { error } = await client
    .from("messages")
    .insert([
      {
        chat_id: chatId,
        content: message,
        role: role,
      },
    ])
    .single();

  if (error) {
    throw new Error("Error saving message", error);
  }
}

/**
 * Get the messages for a chat
 * @param chatId
 * @returns messages
 */
async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const client = getClient();
  const { data: messages, error } = await client
    .from("messages")
    .select("content, role")
    .eq("chat_id", chatId);

  if (error) {
    throw new Error("Error getting messages", error);
  }

  return messages;
}

/**
 * *********************************
 * HTTP HANDLERS
 * *********************************
 */

/**
 * Get the chat messages
 * @param req RequestWithUser
 * @returns response
 */
async function GET(req: RequestWithUser) {
  try {
    const user = req.user;

    // Get the chat for the current user
    const chat = await getChat(user);

    // Get the messages for the chat
    const messages = await getMessagesByChatId(chat.id);

    return new Response(JSON.stringify({ messages }), { status: 200 });
  } catch (e) {
    console.error("Error processing request:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: e }),
      { status: 500 },
    );
  }
}

/**
 * Save a new message in the chat and get a response from the AI
 * @param req RequestWithUser
 * @returns response
 */
async function POST(req: RequestWithUser) {
  try {
    // Validate that the `message` field is provided
    const { message } = await req.json();
    await validateBody({ message });

    // Initialize the client and retrieve the current user
    const user = req.user;

    // Get the chat for the current user
    const chat = await getChat(user);

    // Insert the new message into the chat
    await addMessageToChat(message, chat.id, "user");

    // Get the messages for the chat
    const daysTranscurred = calculateDaysTranscurred(chat.created_at);

    // Get the messages for the chat
    const messages = await getMessagesByChatId(chat.id);

    // Send the message as a prompt to the OpenAI API
    const aiMessage = await createChatConversationsOpenAi(
      messages,
      daysTranscurred,
    );

    // Save the AI's response as a message in the chat
    await addMessageToChat(aiMessage, chat.id, "assistant");

    const messageResponse: Message = { content: aiMessage, role: "assistant" };

    // Return the message in the response
    return new Response(JSON.stringify({ message: messageResponse }), {
      status: 200,
    });
  } catch (e) {
    // Log unexpected errors and return an internal server error response
    console.error("Error processing request:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: e }),
      { status: 500 },
    );
  }
}

/**
 * Serve the request
 */
serve(async (req: Request) => {
  return await withSession(req, async (req) => {
    switch (req.method) {
      case "GET":
        return await GET(req);
      case "POST":
        return await POST(req);
      default:
        return new Response("Method not allowed", { status: 405 });
    }
  });
});
