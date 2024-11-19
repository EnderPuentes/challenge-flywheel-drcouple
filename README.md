# Challenge Flywheel - [Dr Couple](https://drcouple.flutterflow.app)

## Technologies

- Supabase for database management and authentication.
- Deno as the runtime environment for the functions.
- OpenAI account for the AI assistant integration.

## Project Structure

```perl
.github/
       workflows/
                send-daily-messages: Automatic task to start the conversation for the first 90 days

supabase/
        functions/ - Folder containing the implemented Edge functions.
                chat.ts - Function used in the app to send and receive messages
                send-daily-messages.ts - Function used to send automatic daily messages during the first 90 days
```

## Functions

### Chat

The chat function contains the get and post methods, which are used to manage the chat in the app.

### Send Daily Message

Within the send-daily-messages function, the post method is triggered by the GitHub action every hour to send the automatic message corresponding to the current day since the start of the chat, over a period of 90 days.
