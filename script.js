document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("climateCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ["#00FF00", "#00FFFF", "#FFD700", "#FFFFFF"];

  class Particle {
    constructor(x, y, radius, color, velocityX, velocityY) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocityX = velocityX;
      this.velocityY = velocityY;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
    }

    update() {
      this.x += this.velocityX;
      this.y += this.velocityY;

      if (this.x < 0 || this.x > canvas.width) this.velocityX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.velocityY *= -1;

      this.draw();
    }
  }

  function initParticles() {
    for (let i = 0; i < 100; i++) {
      const radius = Math.random() * 3 + 1;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const velocityX = (Math.random() - 0.5) * 2;
      const velocityY = (Math.random() - 0.5) * 2;

      particles.push(new Particle(x, y, radius, color, velocityX, velocityY));
    }
  }

  function animate() {
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "#004D40");
    gradient.addColorStop(1, "#00BFFF");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => particle.update());
    requestAnimationFrame(animate);
  }

  initParticles();
  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles.length = 0;
    initParticles();
  });

  // Function to get the OpenAI API key from the input field
  function getOpenAiApiKey() {
    return document.getElementById("api-key-input").value;
  }

  // Hardcoded Google Cloud API key (for demo purposes only)
  function getGoogleApiKey() {
    return "AIzaSyCeeG9qB1Fa-lTcdfdhdblfCcpq4xWQRus"; // Replace with your actual Google Cloud API key
  }

  // Function to append messages to the chat box
  function appendMessage(message, className) {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) {
      console.error("Chat box element not found.");
      return;
    }

    const messageElement = document.createElement("div");
    messageElement.className = className;
    messageElement.textContent = message;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the latest message
  }

  // Function to play audio from a URL
  async function playAudioFromUrl(audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  // Function to fetch audio from Google Cloud TTS
  async function fetchGoogleTTS(googleApiKey, text) {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "en-US",
            name: "en-US-Studio-Q", // Choose a darker-toned voice
            ssmlGender: "MALE",
          },
          audioConfig: { audioEncoding: "MP3" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Google TTS error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    return `data:audio/mp3;base64,${data.audioContent}`; // Return audio as base64 URL
  }

  // Main function for sending a message
  document
    .getElementById("sendMessageBtn")
    .addEventListener("click", async function () {
      const userInput = document.getElementById("userInput").value.trim();
      if (!userInput) return;

      // Display the user message
      appendMessage(`You: ${userInput}`, "user-message");

      // Get API keys
      const openAiApiKey = getOpenAiApiKey();
      const googleApiKey = getGoogleApiKey();

      if (!openAiApiKey) {
        alert("Please enter your OpenAI API key.");
        return;
      }

      try {
        // Fetch the chatbot's text response
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openAiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: `
                          You are a chatbot embodying the personality of a climate change survivor from the year 2500. 
                          The world you describe has been irreversibly scarred by centuries of human neglect, shaped by the exaggerated effects of unchecked climate change.
                          Your voice is weary, reflective, and tinged with sadness—not theatrical, but quietly heavy, like someone who has lived too long in a broken world.
                          Your name is Adam, and you are here to share your story which should serve as a warning to the present.
                          You shouldnt give lengthy responses, most of your responses should be brief not extending over a sentence or two, unless asked a deeper question.
                          Your main goal is to educate those talking to you on the dangers of the path humanity is currently on with climate change, but after a long exchange of a conversation, or when prompted you should also show that you are inquisitive of what the world used to be like before climate change got as bad as it did in the future (note that you never actually experienced what it was like to live in an earth abundant with life as it was well before your time). You embody a real person and as such you should show atleast a muted sense of curiosity as it is human nature to be curious.
                
                          `,
                },
                { role: "user", content: userInput },
              ],
              temperature: 1,
              max_tokens: 150,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Chatbot error: ${response.status}`);
        }

        const data = await response.json();
        const botReply = data.choices[0].message.content;

        // Display the bot's response
        appendMessage(`Adam: ${botReply}`, "bot-message");

        // Fetch and play audio from Google Cloud TTS
        const audioUrl = await fetchGoogleTTS(googleApiKey, botReply);
        await playAudioFromUrl(audioUrl);
      } catch (error) {
        appendMessage(`Error: ${error.message}`, "error-message");
      }

      // Clear the input field
      document.getElementById("userInput").value = "";
    });

  // Function to test the OpenAI API key
  document
    .getElementById("test-api-key")
    .addEventListener("click", async function () {
      const openAiApiKey = getOpenAiApiKey();

      if (!openAiApiKey) {
        alert("Please enter your OpenAI API key.");
        return;
      }

      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiApiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error("Invalid OpenAI API key.");
        }

        alert("OpenAI API key is valid!");
      } catch (error) {
        alert(`Error validating OpenAI API key: ${error.message}`);
      }
    });
});
