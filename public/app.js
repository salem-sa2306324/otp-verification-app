const $ = (selector) => document.querySelector(selector);
const tabs = document.querySelectorAll(".tab");
const sendForm = $("#send-form");
const verifyForm = $("#verify-form");
const destinationInput = $("#destination");
const statusMessage = $("#status");
let channel = "email";

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = isError ? "status error" : "status";
}
function clearStatus() {
  statusMessage.textContent = "";
  statusMessage.className = "status hidden";
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    channel = tab.dataset.channel;
    const isSms = channel === "sms";
    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    $("#destination-label").textContent = isSms ? "Phone number" : "Email address";
    destinationInput.type = isSms ? "tel" : "email";
    destinationInput.autocomplete = isSms ? "tel" : "email";
    destinationInput.placeholder = isSms ? "+1 555 123 4567" : "you@example.com";
    $("#destination-help").textContent = isSms
      ? "Include your country code, for example +1."
      : "We’ll send a six-digit code to this address.";
    clearStatus();
  });
});

sendForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = sendForm.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Sending…";
  clearStatus();
  try {
    const response = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, destination: destinationInput.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not send the code.");
    $("#sent-message").textContent = "We sent a code to " + destinationInput.value + ". It expires in five minutes.";
    sendForm.classList.add("hidden");
    verifyForm.classList.remove("hidden");
    $("#code").focus();
    showStatus(result.message);
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "Send code";
  }
});

verifyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();
  try {
    const response = await fetch("/api/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, destination: destinationInput.value, code: $("#code").value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Verification failed.");
    verifyForm.classList.add("hidden");
    showStatus(result.message);
  } catch (error) {
    showStatus(error.message, true);
  }
});

$("#change-contact").addEventListener("click", () => {
  verifyForm.classList.add("hidden");
  sendForm.classList.remove("hidden");
  $("#code").value = "";
  clearStatus();
  destinationInput.focus();
});
