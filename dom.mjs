// ===================================================
// DOM Manipulation and User Interface Logic
// ===================================================

import {
  fetchUserData,
  extractLanguagesFromUsers,
  sortUsersByScore,
} from "./api.mjs";

// ----------------------
// DOM ELEMENT REFERENCES
// ----------------------
const showRankingsBtn = document.getElementById("show-rankings-btn");
const usernameInput = document.getElementById("username-input");
const leaderboardBody = document.getElementById("leaderboard-body");
const errorMessage = document.getElementById("error-message");
const loader = document.getElementById("loader");
const languageSelect = document.getElementById("language-select");

// ----------------------
// SHOW RANKINGS BUTTON HANDLER
// ----------------------
showRankingsBtn.addEventListener("click", async () => {
  const usernames = usernameInput.value
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  if (!usernames.length) {
    errorMessage.textContent = "⚠️ Please enter at least one username.";
    return;
  }

  // Reset UI state
  errorMessage.textContent = "";
  leaderboardBody.innerHTML = "";
  loader.hidden = false;
  showRankingsBtn.disabled = true;
  languageSelect.disabled = true;

  try {
    // Fetch all user data concurrently
    const usersData = await fetchUserData(usernames);

    // Extract all available languages
    const languages = ["overall", ...extractLanguagesFromUsers(usersData)];

    // Populate dropdown
    languageSelect.innerHTML = "";
    languages.forEach((lang) => {
      const option = document.createElement("option");
      option.value = lang;
      option.textContent = lang[0].toUpperCase() + lang.slice(1);
      languageSelect.appendChild(option);
    });
    languageSelect.disabled = false;

    // Display initial leaderboard (overall)
    updateLeaderboard(usersData, "overall");

    // Update when user selects another language
    languageSelect.addEventListener("change", () =>
      updateLeaderboard(usersData, languageSelect.value)
    );
  } catch (err) {
    console.error(err);
    errorMessage.textContent =
      "❌ Could not fetch user data. Please check usernames.";
  } finally {
    loader.hidden = true;
    showRankingsBtn.disabled = false;
  }
});

// ----------------------
// UPDATE LEADERBOARD
// ----------------------
function updateLeaderboard(usersData, language) {
  leaderboardBody.innerHTML = "";

  // Sort users by score
  const sortedUsers = sortUsersByScore(usersData, language);

  if (!sortedUsers.length) {
    leaderboardBody.innerHTML =
      "<tr><td colspan='4'>No valid data available</td></tr>";
    return;
  }

  // Build table rows dynamically
  sortedUsers.forEach((user, index) => {
    const rank = index + 1;
    const medal =
      rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";

    const score =
      language === "overall"
        ? user.ranks.overall.score
        : user.ranks.languages?.[language]?.score ?? "N/A";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>#${rank}</strong> ${medal}</td>
      <td><a href="https://www.codewars.com/users/${user.username}" target="_blank">${user.username}</a></td>
      <td>${user.clan || "—"}</td>
      <td class="score">${score.toLocaleString?.() || score}</td>
    `;
    leaderboardBody.appendChild(row);
  });
}
