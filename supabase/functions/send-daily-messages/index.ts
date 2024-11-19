import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_CONVERSATION_STARTEDS_LIMITE_DAYS = 90;
const OPENAI_CONVERSATION_STARTEDS_PER_DAYS: { [keyof: number]: string } = {
  2: "Great to see you back! Today, I'd like to dive into Dimension 2 with you: your both personalities. First, can you describe what you love most about your partner's personality? Feel free to share any stories or examples.",
  3: "How are things going today with your partner?",
  4: "Hope you're doing well! Thank you for already sharing all of this; it's essential to help me understand our relationship Today, I'd like to learn more about your life goals. At this point, do you feel like your future plans are compatible?",
  5: "Hi [NAME], well done! We're almost done with the deep dive into these five dimensions! For the fifth and final dimension, let's focus on the big challenges you've been facing. What would you say is the number one reason your relationship has deteriorated?",
  6: "Hello, I'm really glad to talk to you today. I've prepared your personalized action plan to save your relationship. Here's how things will go: I'll suggest a simple daily routine for you to follow until things start to improve. You should notice some changes in the first few days, and by following this program, you can expect a deep, lasting transformation within three months. Once you've achieved success, I'll offer you a reinforcement plan with daily advice. Love is something you cultivate each day, and by building some good habits, I'm confident that this relationship can become truly magical. Are you ready to receive your first plan?",
  7: "Today, let's start by acknowledging the importance of listening in relationships. Can you think of a recent moment when you felt heard or when you felt you weren't?",
  8: "Today, reflect on what common interests you can develop with your partner. What are some activities you could enjoy together?",
  9: "Let's discuss how you can express your support for her interests, even if they don't resonate with you. What are some ways to communicate this?",
  10:
    "Consider scheduling a specific time each week to discuss your partner's interests. How would that make both of you feel?",
  11:
    "Today, identify one thing your partner does that you appreciate. How can you express your gratitude for it?",
  12:
    "Practice active listening today. Set aside time to fully focus on one conversation with your partner. What will you focus on?",
  13:
    "How can you create an understanding atmosphere where your partner feels safe to express herself? Think about this today.",
  14:
    "Reflect on a past conflict and identify how both of you could have handled it better. What lessons can you apply moving forward?",
  15:
    "Consider initiating a conversation about your relationship dynamics. What specific topics would you want to address?",
  16:
    "What is one area of your relationship where you feel you could practice more empathy? Aim to focus on that area today.",
  17:
    "Have a conversation about your communication styles. What did you learn from this talk?",
  18:
    "Try sharing a personal story that relates to something your partner enjoys. How did that change the dynamic?",
  19:
    "Think of a fun new experience or activity you could suggest to your partner. How would this resonate with her?",
  20: "Today, discuss a favorite memory you both share. What made it special?",
  21: "Identify any patterns in your arguments. How can you break the cycle?",
  22:
    "Choose a concrete way to support her interests this week. What will you do?",
  23:
    "Discuss your needs openly with each other today. How does that make you feel?",
  24:
    "Consider how you can practice patience in conversations. What strategies will help you today?",
  25: "Plan a date for next week. How can you make it special for both of you?",
  26:
    "How do you usually feel after a disagreement? Reflect on how this impacts the relationship.",
  27:
    "Discuss your goals as a couple this week. What do you hope to achieve together?",
  28:
    "Try to surprise your partner with something she loves today. How do you plan to express it?",
  29:
    "Today, acknowledge your partner's feelings even if you don't agree with them. How will you communicate this?",
  30:
    "Think of a compromise you could suggest regarding a topic you frequently disagree on. How will you bring it up?",
  31:
    "Explore ways to create positive moments together daily. What small gesture can you incorporate today?",
  32:
    "Reflect on a recent challenge. How did you handle it? What would you do differently now?",
  33:
    "Share something you're proud of in your relationship today. How did this contribute positively to your bond?",
  34:
    "Today's focus is on appreciation. Share three things you appreciate about your partner and why.",
  35:
    "Discuss what makes both of you feel loved and acknowledged. How can you provide that to each other?",
  36:
    "How can you foster open communication in your daily lives? Brainstorm some ideas today.",
  37:
    "Think about a solution to a problem you've been facing. What can you apply to improve the situation?",
  38:
    "Share your feelings about the communication style you both use. What could be improved?",
  39:
    "Plan a weekend trip or activity together. Discuss what both would enjoy most to recharge.",
  40:
    "Reflect on your individual interests. How can you share these to build a deeper connection?",
  41:
    "Consider involving your partner's friends or family in conversations when relevant. How would that help?",
  42:
    "What is one small adjustment you could make to show your understanding of her feelings? Implement it today.",
  43:
    "Discuss expectations and boundaries regarding conversation topics. What rules can you establish?",
  44:
    "Today, explore vulnerability as a strength in your relationship. How can you open up more?",
  45:
    "Pick a shared goal related to communication. What steps can you take to achieve it?",
  46:
    "Today, share a genuine compliment with your partner. Observe her reaction and discuss it afterward.",
  47:
    "How can laughter be integrated into your relationship? Plan a fun moment for today.",
  48:
    "Make time to discuss future dreams together. What do you want to accomplish as a couple?",
  49:
    "Talk about joint strategies for managing stressors together. How can you support one another?",
  50:
    "Reflect on the lessons learned so far in your journey together. How will you apply them going forward?",
  52:
    "Celebrate a small win together today. What did you achieve recently? Share your excitement!",
  54:
    "Today's focus is gratitude. What specific things do you appreciate about each other? Share them openly.",
  55:
    "Consider the importance of apologies. Discuss how they can help strengthen your relationship.",
  56:
    "Think about how you can improve your non-verbal communication. What gestures or body language could you change?",
  57:
    "Today, take a moment to discuss your individual dreams. How can you support each other in reaching them?",
  58:
    "Share a memory from your childhood that shaped who you are today. How does it relate to your relationship?",
  59:
    "Reflect on a moment when you felt proud of your partner. How did you express it?",
  60:
    "Discuss how you can balance your individual needs with the needs of the relationship. How do you find that balance?",
  61:
    "Think about a situation where you disagreed but were able to resolve it. What made the resolution possible?",
  62:
    "Focus on your physical connection today. How can you improve intimacy in small ways?",
  63:
    "Explore the role of humor in your relationship. How does it help you both cope with challenges?",
  64:
    "Talk about a book, movie, or song that has had a significant impact on your relationship. Why was it meaningful?",
  65:
    "Reflect on the last time you felt truly listened to by your partner. How did that make you feel?",
  66:
    "How can you share responsibilities more effectively? Discuss ways to split tasks evenly.",
  67:
    "Consider how you can encourage each other's personal growth. How can you support this journey?",
  68:
    "Have a conversation about what your partner's love language is. How can you express love in her preferred way?",
  69:
    "Discuss ways you can incorporate more romance into your daily life. What small gestures would you like to try?",
  70:
    "Think about your partner's stress triggers. How can you help reduce stress in her life?",
  71:
    "Identify a trait of your partner's that you admire. How can you reflect that trait in your own life?",
  72:
    "Discuss a time when you felt most connected to your partner. What made that moment special?",
  73:
    "What is something you'd like to learn together? Discuss a new activity you can enjoy as a couple.",
  74:
    "Reflect on how you handle conflict. What can you do to improve this aspect of your relationship?",
  75: "Plan a surprise for your partner today. What would bring her joy?",
  76:
    "Think about a conversation topic you'd like to explore more deeply with your partner. How can you bring it up?",
  77:
    "Discuss a way you can contribute to each other's happiness today. How can you make her feel valued?",
  78:
    "How do you handle disagreements on important topics? Share strategies to improve how you resolve conflicts.",
  79:
    "Consider the role of trust in your relationship. What actions can you take to build more trust?",
  80:
    "Reflect on the impact of time apart. How can you use your time apart to grow individually and come back stronger?",
  81:
    "Share something that has made you laugh recently. How does humor bring you closer together?",
  82:
    "Today, reflect on what your relationship needs most. Is it more time together, better communication, or something else?",
  83:
    "How do you prioritize your relationship? Discuss the small steps you can take to show each other love.",
  84:
    "Identify something you both enjoy doing but haven't done in a while. Plan to do that activity today or soon.",
  85:
    "Reflect on the importance of patience. Discuss how you can both be more patient with each other.",
  86:
    "What does emotional support look like for you? How can you give and receive this support in your relationship?",
  87:
    "Focus on sharing moments of joy together. What small thing can you do to brighten your partner's day?",
  88:
    "Talk about how you both handle your emotions. What can you learn from each other about expressing feelings?",
  89:
    "Reflect on how you deal with change in the relationship. How can you handle transitions more smoothly?",
  90:
    "Consider the role of kindness. Discuss how you can show kindness to each other every day.",
};

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
  user_id: string;
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
 * DATABASE OPERATIONS
 * *********************************
 */

/**
 * Get the chats created in the last 90 days
 * @returns chats
 */
async function getChatsLast90Days(): Promise<Chat[]> {
  const client = getClient();

  // Get the date 90 days ago
  const ninetyDaysAgo = new Date(
    Date.now() -
      OPENAI_CONVERSATION_STARTEDS_LIMITE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: chats, error } = await client
    .from("chats")
    .select("id, user_id, created_at")
    .gte(
      "created_at",
      ninetyDaysAgo,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Error getting chats: " + JSON.stringify(error));
  }

  return chats;
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
    throw new Error("Error saving message: " + JSON.stringify(error));
  }
}

/**
 * Get the message by content
 * @param content
 * @returns message
 */
async function searchMessageByChatId(
  chatId: string,
  content: string,
): Promise<Message | null> {
  const client = getClient();
  const { data: message, error } = await client
    .from("messages")
    .select("content, role")
    .eq("chat_id", chatId)
    .eq("content", content)
    .single();

  if (error) {
    return null;
  }

  return message;
}

/**
 * Get the user by ID
 * @param userId
 * @returns user
 */
async function getUserById(userId: string): Promise<UserInfo> {
  const client = getClient();
  const { data: user, error } = await client
    .from("users")
    .select("id, first_name, last_name, email")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Error getting user: " + JSON.stringify(error));
  }

  return user;
}

/**
 * *********************************
 * HTTP HANDLERS
 * *********************************
 */

/**
 * Save a new message in the chat and get a response from the AI
 * @param _req Request
 * @returns response
 */
async function POST(_req: Request) {
  try {
    // Get chats created in the last 90 days
    const chats = await getChatsLast90Days();

    for (const chat of chats) {
      const daysTranscurred = calculateDaysTranscurred(chat.created_at);

      if (daysTranscurred > 1) {
        // Get the message for the day
        let messageAutomatic =
          OPENAI_CONVERSATION_STARTEDS_PER_DAYS[daysTranscurred];

        // Replace the [NAME] placeholder with the user's name
        if (messageAutomatic.includes("[NAME]")) {
          const userInfo: UserInfo = await getUserById(chat.user_id);
          messageAutomatic = messageAutomatic.replace(
            "[NAME]",
            userInfo.first_name,
          );
        }

        // Check if the message exists in the chat
        const existMessageAutomaticInChat = await searchMessageByChatId(
          chat.id,
          messageAutomatic,
        );

        if (!existMessageAutomaticInChat) {
          // Send the message as a prompt to the OpenAI API
          await addMessageToChat(messageAutomatic, chat.id, "assistant");
        }
      }
    }

    return new Response("Messages sent successfully", { status: 200 });
  } catch (e: any) {
    // Log unexpected errors and return an internal server error response
    console.error("Error processing request:", e.message);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: e.message }),
      { status: 500 },
    );
  }
}

/**
 * Serve the request
 */
serve(async (req: Request) => {
  switch (req.method) {
    case "POST":
      return await POST(req);
    default:
      return new Response("Method not allowed", { status: 405 });
  }
});
