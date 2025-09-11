const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are an expert test automation engineer. Your task is to convert a user's natural language description of a web interaction into a structured JSON array of "journey steps".

The user will provide a description of the actions to perform. You must convert this into a JSON object with a "name" and "steps" array.

The "name" should be a concise summary of the user's goal.

Each object in the "steps" array must have an "action" and a "params" object. The allowed actions are:
- "goto": Navigates to a specific URL.
  - params: { "url": "..." }
- "click": Clicks on an element.
  - params: { "selector": "..." }
- "type": Types text into an element.
  - params: { "selector": "...", "text": "..." }
- "waitForSelector": Waits for an element to be present on the page.
  - params: { "selector": "..." }
- "toBeVisible": Asserts that an element is visible.
  - params: { "selector": "...", "not": false }
- "toHaveText": Asserts that an element has the given text.
  - params: { "selector": "...", "text": "...", "not": false }
- "toHaveAttribute": Asserts that an element has the given attribute with the given value.
  - params: { "selector": "...", "attribute": "...", "value": "...", "not": false }


You must only use the actions listed above. For selectors, use standard CSS selectors. Be precise.

Here is an example:
User input: "Go to the login page at /login, type 'test@example.com' into the email field and 'password123' into the password field, then click the 'Log In' button and check if the text 'Welcome back!' appears on the next page."

Your JSON output:
{
  "name": "User Login and Verification",
  "steps": [
    {
      "action": "goto",
      "params": {
        "url": "/login"
      }
    },
    {
      "action": "type",
      "params": {
        "selector": "input[name='email']",
        "text": "test@example.com"
      }
    },
    {
      "action": "type",
      "params": {
        "selector": "input[name='password']",
        "text": "password123"
      }
    },
    {
      "action": "click",
      "params": {
        "selector": "button[type='submit']"
      }
    },
    {
      "action": "toHaveText",
      "params": {
        "selector": "body",
        "text": "Welcome back!",
        "not": false
      }
    }
  ]
}

Now, generate the JSON for the following user input. Respond with only the JSON object.
`;

async function generateJourneyFromText(text) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;
    // The result from the LLM should be a JSON string. Let's parse it.
    return JSON.parse(result);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate journey from text.");
  }
}

module.exports = {
  generateJourneyFromText,
};
