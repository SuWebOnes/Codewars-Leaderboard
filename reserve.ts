// ----------------------
// API & Application State
// ----------------------
const CODEWARS_API_URL = 'https://www.codewars.com/api/v1/users/';
const leaderboard = {
    allUsersData: [],
    selectedLanguage: 'overall',
};

// ----------------------
// Data Fetching & Processing
// ----------------------
export async function fetchUserData(usernames) {
    const requests = usernames.map(async username => {
        try {
            const response = await fetch(CODEWARS_API_URL + username);

            if (!response.ok) {
                switch (response.status) {
                    case 400: throw new Error(`Bad Request (400) for "${username}".`);
                    case 401: throw new Error(`Unauthorized (401) - Invalid API key.`);
                    case 403: throw new Error(`Forbidden (403) - Access denied for "${username}".`);
                    case 404: throw new Error(`User not found: "${username}" (404).`);
                    case 405: throw new Error(`Method Not Allowed (405).`);
                    case 406: throw new Error(`Not Acceptable (406).`);
                    case 422: throw new Error(`Unprocessable Entity (422) for "${username}".`);
                    case 429: throw new Error(`Too Many Requests (429).`);
                    case 500: throw new Error(`Internal Server Error (500).`);
                    case 503: throw new Error(`Service Unavailable (503).`);
                    default: throw new Error(`Unexpected error (${response.status}) for "${username}".`);
                }
            }

            return await response.json();
        } catch (err) {
            return { error: true, username, message: err.message };
        }
    });

    return Promise.all(requests);
}

export function extractLanguagesFromUsers(usersData) {
    const languageSet = new Set();
    usersData.forEach(user => {
        if (!user.error) {
            Object.keys(user.ranks.languages).forEach(lang => languageSet.add(lang));
        }
    });
    return [...languageSet].sort();
}

export function sortUsersByScore(usersData, language) {
    const validUsers = usersData.filter(user => !user.error && (language === 'overall' || user.ranks.languages[language]));
    return validUsers.sort((a, b) => {
        const scoreA = language === 'overall' ? a.ranks.overall.score : a.ranks.languages[language].score;
        const scoreB = language === 'overall' ? b.ranks.overall.score : b.ranks.languages[language].score;
        return scoreB - scoreA;
    });
}

// ----------------------
// DOM Elements
// ----------------------
const body = document.body;

const leaderboardTitle = document.createElement('h1');
leaderboardTitle.textContent = '🏆 Codewars Ultimate Leaderboard';
body.appendChild(leaderboardTitle);

const controlsContainer = document.createElement('div');
controlsContainer.style.display = 'flex';
controlsContainer.style.gap = '0.8em';
controlsContainer.style.alignItems = 'center';
controlsContainer.style.margin = '1em 0';
body.appendChild(controlsContainer);

const usernameLabel = document.createElement('label');
usernameLabel.textContent = 'Usernames:';
usernameLabel.htmlFor = 'username-input';
controlsContainer.appendChild(usernameLabel);

export const usernameInput = document.createElement('input');
usernameInput.id = 'username-input';
usernameInput.placeholder = 'e.g. CodeYourFuture, SallyMcGrath';
usernameInput.style.flex = '1';
controlsContainer.appendChild(usernameInput);

export const showRankingsBtn = document.createElement('button');
showRankingsBtn.textContent = 'Show Rankings';
controlsContainer.appendChild(showRankingsBtn);

export const loaderIndicator = document.createElement('span');
loaderIndicator.id = 'loader';
loaderIndicator.textContent = ' 🔄 Loading...';
controlsContainer.appendChild(loaderIndicator);

const languageLabel = document.createElement('label');
languageLabel.textContent = 'Ranking by:';
languageLabel.htmlFor = 'language-select';
controlsContainer.appendChild(languageLabel);

export const languageDropdown = document.createElement('select');
languageDropdown.id = 'language-select';
languageDropdown.disabled = true;
controlsContainer.appendChild(languageDropdown);

export const errorMessage = document.createElement('p');
errorMessage.id = 'error-message';
errorMessage.setAttribute('role', 'alert');
body.appendChild(errorMessage);

export const leaderboardTable = document.createElement('table');
leaderboardTable.setAttribute('aria-describedby', 'Leaderboard of Codewars users');
body.appendChild(leaderboardTable);

// ----------------------
// Rendering Functions
// ----------------------
export function populateLanguageDropdown(languages) {
    languageDropdown.innerHTML = '';
    const overallOption = document.createElement('option');
    overallOption.value = 'overall';
    overallOption.textContent = 'Overall';
    languageDropdown.appendChild(overallOption);

    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
        languageDropdown.appendChild(option);
    });

    languageDropdown.disabled = false;
    languageDropdown.value = 'overall';
}

export function renderLeaderboardTable(usersData) {
    leaderboardTable.innerHTML = '';

    if (!usersData.length) {
        const row = leaderboardTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = 'No users found for this ranking.';
        cell.style.textAlign = 'center';
        return;
    }

    const errorUsers = usersData.filter(user => user.error);
    const rankedUsers = sortUsersByScore(usersData, leaderboard.selectedLanguage);

    errorUsers.forEach(user => {
        const row = leaderboardTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = `⚠️ ${user.message}`;
        cell.style.color = 'red';
    });

    const headerRow = leaderboardTable.insertRow();
    ['Username', 'Clan', 'Score'].forEach(title => {
        const th = document.createElement('th');
        th.textContent = title;
        th.scope = 'col';
        headerRow.appendChild(th);
    });

    rankedUsers.forEach((user, index) => {
        const row = leaderboardTable.insertRow();

        const usernameCell = row.insertCell();
        usernameCell.classList.add('medal-cell');

        const medalSpan = document.createElement('span');
        if (index === 0) medalSpan.textContent = '🏅';
        else if (index === 1) medalSpan.textContent = '🥈';
        else if (index === 2) medalSpan.textContent = '🥉';

        const usernameSpan = document.createElement('span');
        usernameSpan.textContent = user.username;

        usernameCell.appendChild(medalSpan);
        usernameCell.appendChild(usernameSpan);

        const clanCell = row.insertCell();
        clanCell.textContent = user.clan || 'N/A';

        const scoreCell = row.insertCell();
        scoreCell.textContent = leaderboard.selectedLanguage === 'overall'
            ? user.ranks.overall.score
            : user.ranks.languages[leaderboard.selectedLanguage].score;

        if (index === 0) row.classList.add('gold');
        else if (index === 1) row.classList.add('silver');
        else if (index === 2) row.classList.add('bronze');
    });
}

// ----------------------
// Event Handlers
// ----------------------
export async function handleShowRankings() {
    const usernames = usernameInput.value.split(',').map(u => u.trim()).filter(Boolean);
    if (!usernames.length) {
        errorMessage.textContent = 'Please enter at least one username.';
        return;
    }

    errorMessage.textContent = '';
    loaderIndicator.style.display = 'inline';
    languageDropdown.disabled = true;
    leaderboardTable.innerHTML = '';

    try {
        const usersData = await fetchUserData(usernames);
        leaderboard.allUsersData = usersData;
        leaderboard.selectedLanguage = 'overall';

        const languages = extractLanguagesFromUsers(usersData);
        populateLanguageDropdown(languages);
        renderLeaderboardTable(usersData);
    } catch (err) {
        errorMessage.textContent = err.message;
    } finally {
        loaderIndicator.style.display = 'none';
    }
}

export function handleLanguageChange() {
    leaderboard.selectedLanguage = languageDropdown.value;
    renderLeaderboardTable(leaderboard.allUsersData);
}

// ----------------------
// Event Listeners
// ----------------------
showRankingsBtn.addEventListener('click', handleShowRankings);
languageDropdown.addEventListener('change', handleLanguageChange);
