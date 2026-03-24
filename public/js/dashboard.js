(function initDashboardAssistant() {
  const OFFLINE_SETUP_MESSAGE =
    "AI chat is not configured yet. Add GEMINI_API_KEY to your .env file and reload the app.";
  const OFFLINE_SETUP_HINT =
    "Add GEMINI_API_KEY to your .env file to enable the business coach. The chat UI is ready once the key is configured.";
  const ONLINE_WELCOME_MESSAGE =
    "I can review your current numbers, point out risks, and suggest practical next steps. Try asking about profit, expense control, or growth opportunities.";
  const FRESH_CHAT_MESSAGE =
    "Fresh chat started. Ask for a business review, cost control ideas, or growth priorities.";
  const LOCAL_ASSISTANT_NOTES = new Set([
    OFFLINE_SETUP_MESSAGE,
    OFFLINE_SETUP_HINT,
    ONLINE_WELCOME_MESSAGE,
    FRESH_CHAT_MESSAGE,
  ]);
  const panel = document.getElementById("assistantPanel");
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  const sendButton = document.getElementById("assistantSend");
  const messages = document.getElementById("assistantMessages");
  const suggestionButtons = document.querySelectorAll(".suggestion-chip");
  const clearButton = document.getElementById("assistantClear");

  if (!panel || !form || !input || !sendButton || !messages) {
    return;
  }

  const STORAGE_KEY = `finpulse.assistant.messages.${panel.dataset.userKey || "guest"}`;
  const aiEnabled = panel.dataset.aiEnabled === "true";

  function getConversationHistory() {
    return Array.from(messages.querySelectorAll(".chat-message")).map((node) => ({
      role: node.classList.contains("user") ? "user" : "assistant",
      text: node.querySelector(".chat-bubble")?.textContent || "",
    }));
  }

  function saveConversation() {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(getConversationHistory()),
    );
  }

  function appendMessage(role, text) {
    const row = document.createElement("div");
    row.className = `chat-message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.textContent = role === "assistant" ? "AI" : "You";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    row.append(avatar, bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    saveConversation();
  }

  function renderHistory() {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      const history = JSON.parse(raw);

      if (!Array.isArray(history) || history.length === 0) {
        return;
      }

      if (
        aiEnabled &&
        history.some(
          (entry) =>
            entry &&
            typeof entry.text === "string" &&
            (entry.text.includes(OFFLINE_SETUP_MESSAGE) ||
              entry.text.includes(OFFLINE_SETUP_HINT)),
        )
      ) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }

      messages.innerHTML = "";
      history.forEach((entry) => {
        if (!entry || !entry.role || !entry.text) {
          return;
        }

        const row = document.createElement("div");
        row.className = `chat-message ${entry.role}`;

        const avatar = document.createElement("div");
        avatar.className = "chat-avatar";
        avatar.textContent = entry.role === "assistant" ? "AI" : "You";

        const bubble = document.createElement("div");
        bubble.className = "chat-bubble";
        bubble.textContent = entry.text;

        row.append(avatar, bubble);
        messages.appendChild(row);
      });

      messages.scrollTop = messages.scrollHeight;
    } catch (_error) {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  function clearConversation() {
    messages.innerHTML = "";
    sessionStorage.removeItem(STORAGE_KEY);

    appendMessage(
      "assistant",
      aiEnabled ? FRESH_CHAT_MESSAGE : OFFLINE_SETUP_MESSAGE,
    );
  }

  function setLoading(isLoading) {
    sendButton.disabled = isLoading;
    input.disabled = isLoading;
    sendButton.innerHTML = isLoading
      ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Thinking'
      : '<i class="bi bi-send me-1"></i>Ask';
  }

  function getRequestHistory() {
    return getConversationHistory().filter(
      (entry) =>
        entry.text &&
        !(entry.role === "assistant" && LOCAL_ASSISTANT_NOTES.has(entry.text)),
    );
  }

  async function submitPrompt(prompt) {
    const message = prompt.trim();

    if (!message) {
      return;
    }

    appendMessage("user", message);
    input.value = "";

    if (!aiEnabled) {
      appendMessage("assistant", OFFLINE_SETUP_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: getRequestHistory().slice(0, -1),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        appendMessage(
          "assistant",
          result.error || "The AI assistant could not respond right now.",
        );
        setLoading(false);
        return;
      }

      appendMessage("assistant", result.reply || "I could not generate a reply.");
      saveConversation();
    } catch (_error) {
      appendMessage(
        "assistant",
        "Network error. Please try again in a moment.",
      );
    } finally {
      setLoading(false);
      input.focus();
    }
  }

  renderHistory();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitPrompt(input.value);
  });

  suggestionButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const prompt = button.dataset.prompt || "";
      input.value = prompt;
      await submitPrompt(prompt);
    });
  });

  if (clearButton) {
    clearButton.addEventListener("click", clearConversation);
  }
})();
