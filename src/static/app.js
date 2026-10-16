document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupContainer = document.getElementById("signup-container");
  const messageDiv = document.getElementById("message");
  const authControls = document.getElementById("auth-controls");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  let teacherUsername = null;

  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    setTimeout(() => element.classList.add("hidden"), 5000);
  }

  function renderAuthControls() {
    authControls.replaceChildren();

    if (teacherUsername) {
      const label = document.createElement("span");
      label.className = "teacher-label";
      label.textContent = `Teacher: ${teacherUsername}`;

      const logoutButton = document.createElement("button");
      logoutButton.className = "auth-button button-secondary";
      logoutButton.type = "button";
      logoutButton.textContent = "Sign Out";
      logoutButton.addEventListener("click", handleLogout);
      authControls.append(label, logoutButton);
    } else {
      const loginButton = document.createElement("button");
      loginButton.className = "auth-button";
      loginButton.type = "button";
      loginButton.textContent = "Teacher Sign In";
      loginButton.addEventListener("click", () => loginDialog.showModal());
      authControls.append(loginButton);
    }

    signupContainer.hidden = !teacherUsername;
  }

  async function refreshAuthentication() {
    try {
      const response = await fetch("/auth/me");
      const status = await response.json();
      teacherUsername = status.authenticated ? status.username : null;
    } catch (error) {
      teacherUsername = null;
      console.error("Error checking teacher session:", error);
    }
    renderAuthControls();
  }

  async function handleLogout() {
    try {
      const response = await fetch("/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out");
      teacherUsername = null;
      renderAuthControls();
      await fetchActivities();
      showMessage(messageDiv, "Signed out", "success");
    } catch (error) {
      showMessage(messageDiv, "Unable to sign out. Please try again.", "error");
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map((email) => `<li><span class="participant-email">${email}</span>${
                    teacherUsername
                      ? `<button class="delete-btn" type="button" aria-label="Remove ${email} from ${name}" data-activity="${name}" data-email="${email}">Remove</button>`
                      : ""
                  }</li>`)
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Only teachers are shown unregister controls.
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        showMessage(messageDiv, result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage(messageDiv, "Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        showMessage(loginMessage, result.detail || "Sign in failed", "error");
        return;
      }

      teacherUsername = result.username;
      renderAuthControls();
      loginDialog.close();
      loginForm.reset();
      loginMessage.className = "hidden";
      await fetchActivities();
      showMessage(messageDiv, "Signed in", "success");
    } catch (error) {
      showMessage(loginMessage, "Unable to sign in. Please try again.", "error");
    }
  });

  document.getElementById("cancel-login").addEventListener("click", () => loginDialog.close());

  async function initialize() {
    await refreshAuthentication();
    await fetchActivities();
  }

  initialize();
});
