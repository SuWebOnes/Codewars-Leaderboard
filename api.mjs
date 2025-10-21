// ===================================================
// Codewars API and Data
// ===================================================

export const CODEWARS_API_URL = "https://www.codewars.com/api/v1/users/";

/**
 * Fetch data for multiple Codewars users
 * @param {string[]} usernames
 * @returns {Promise<object[]>}
 */
export async function fetchUserData(usernames) {
  const requests = usernames.map(async (username) => {
    try {
      const response = await fetch(CODEWARS_API_URL + username);
      if (!response.ok) throw new Error(`User not found: ${username}`);
      return await response.json();
    } catch (err) {
      return { error: true, username, message: err.message };
    }
  });

  return Promise.all(requests);
}

/**
 * Extract unique programming languages from all users
 * @param {object[]} usersData
 * @returns {string[]}
 */
export function extractLanguagesFromUsers(usersData) {
  const languageSet = new Set();
  usersData.forEach((user) => {
    if (!user.error && user.ranks?.languages) {
      Object.keys(user.ranks.languages).forEach((lang) =>
        languageSet.add(lang)
      );
    }
  });
  return [...languageSet].sort();
}

/**
 * Sort users by score (overall or language-specific)
 * @param {object[]} usersData
 * @param {string} language
 * @returns {object[]}
 */
export function sortUsersByScore(usersData, language) {
  const validUsers = usersData.filter(
    (user) =>
      !user.error &&
      (language === "overall" || user.ranks.languages?.[language])
  );

  return validUsers.sort((a, b) => {
    const scoreA =
      language === "overall"
        ? a.ranks.overall.score
        : a.ranks.languages[language].score;
    const scoreB =
      language === "overall"
        ? b.ranks.overall.score
        : b.ranks.languages[language].score;
    return scoreB - scoreA;
  });
}
