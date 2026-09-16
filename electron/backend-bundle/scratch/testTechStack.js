const { Groq } = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const schema = {
    name: "blueprint",
    strict: true,
    schema: {
        type: "object",
        properties: {
            techStack: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: ["string", "null"] },
                        category: { type: ["string", "null"] },
                        source: { type: ["string", "null"] }
                    },
                    required: ["name", "category", "source"],
                    additionalProperties: false
                }
            }
        },
        required: ["techStack"],
        additionalProperties: false
    }
};

async function test() {
    try {
        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                { role: "user", content: "Test" }
            ],
            response_format: { type: "json_schema", json_schema: schema }
        });
        console.log("Success:", completion.choices[0].message.content);
    } catch (err) {
        console.error("Groq Error:");
        console.error(JSON.stringify(err, null, 2));
    }
}
test();
