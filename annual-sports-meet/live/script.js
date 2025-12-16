let prevHouseTotals = {
   'Ruby': 0,
   'Emerald': 0,
   'Sapphire': 0,
   'Topaz': 0
};
let pointCriteria = {
   'Individual': [10, 7, 5],
   'Grouped': [10, 7, 5],
   'Team': [20, 14, 10],
};
let totalEvents = {};
let winners, events;
const popupBox = document.getElementById('popupBox');
const popupHeading = document.getElementById('popupHeading');
const popupMsg = document.getElementById('popupMsg');
const popupCloseBtn = document.getElementById('popupCloseBtn');
const downloadBtn = document.getElementById('downloadBtn');
const defaultHeadline = "Get ready for an action-packed celebration! Jamna Vidyapeeth proudly presents the Annual Sports Meet 2025-26. The ultimate showdown begins!";
const savedResultsURL = "https://sourabhsuneja.github.io/jvp-sports-meet/saved-results/";
// Array of congratulatory words and phrases
const congratulatoryWords = [
   "Bravo!",
   "Congratulations!",
   "Well done!",
   "Amazing performance!",
   "Fantastic effort!",
   "Outstanding!",
   "Great job!",
   "Keep it up!",
   "You're a star!",
   "Way to go!",
   "Impressive!",
   "Excellent work!",
   "Superb!",
   "You're unstoppable!",
   "What a win!"
];

async function pollEntireData() {
   // Fetch events list
   events = await selectData('sport_events', false, '*', ['included_in_total'], [true], 'game_name');
   totalEvents = countActiveEvents(events);
   let inLiveMode = true;
   const resultName = getParameterByName('result');
   if (resultName) {
      const fetchedData = await fetchSavedResult(`${savedResultsURL}${resultName}.json`);
      inLiveMode = false;
      winners = fetchedData['winners'];
      prevHouseTotals = fetchedData['Previous Total'];
      console.log('Data fetched from an already saved JSON results file.');
   } else {
      winners = await selectData(
         tableName = 'sport_winners',
         fetchSingle = false,
         columns = '*',
         matchColumns = [],
         matchValues = [],
         orderByColumn = 'row_id',
         orderDirection = 'asc'
      );
   }

   // Populate table rows dynamically
   winners.forEach(winner => {
      addNewRow(winner);
   });

   // Hide loading dialog
   hideProcessingDialog();

   const houseScores = calculateScores(winners);
   updateDashboard(houseScores);
   updatePredictionBar(predictWinPercentage(houseScores.Total));
   return inLiveMode;
}

// Close the popup when clicking the close button
popupCloseBtn.addEventListener('click', () => {
   popupBox.style.display = 'none';
});

// Close the popup when clicking outside the popup content
popupBox.addEventListener('click', (e) => {
   if (e.target === popupBox) {
      popupBox.style.display = 'none';
   }
});

function showPopup(heading, message, showRibbons = false, stayAlive = 43200000) {
   popupHeading.innerHTML = heading;
   popupMsg.innerHTML = message;
   popupBox.style.display = 'flex';
   if (showRibbons) {
      launchConfetti();
   }
   setTimeout(hidePopup, stayAlive); // hide pop-up after a set interval
}

function hidePopup() {
   popupCloseBtn.click();
}

// Set headlines and pop-up after win update
function setHeadlineAndPopupAfterWin(w, updateElement = 'both') {

   if (updateElement === 'headline' || updateElement === 'both') {
      const headlines = generateLiveWinHeadline();
      // update scrolling text
      updateScrollingText(newText = headlines, stayAlive = 240000);
   }

   if (updateElement === 'popup' || updateElement === 'both') {
      // show pop-up with a cheers message
      const heading = "🥳 " + getRandomCongratulatoryWord() + " 🥳";
      const popupContent = generateWinnersMessage(w.winner1, w.winner2, w.winner3, w.winnerhouse1, w.winnerhouse2, w.winnerhouse3, w.game);
      showPopup(heading, popupContent, true, 60000);
   }
}

/**
 * Function to generate cheering text for the pop-up,
 * handling missing winners gracefully.
 */
function generateWinnersMessage(winner1, winner2, winner3, winnerHouse1, winnerHouse2, winnerHouse3, game) {
   const winnerParts = [];

   if (getGameType(game) === 'individual') {
      if (isValid(winner1) && isValid(winnerHouse1)) {
         winnerParts.push(`${winner1} from ${winnerHouse1} House for securing 1st place`);
      }
      if (isValid(winner2) && isValid(winnerHouse2)) {
         winnerParts.push(`${winner2} from ${winnerHouse2} House for 2nd`);
      }
      if (isValid(winner3) && isValid(winnerHouse3)) {
         winnerParts.push(`${winner3} from ${winnerHouse3} House for 3rd`);
      }
   } else { // Team game
      if (isValid(winnerHouse1)) {
         winnerParts.push(`${winnerHouse1} House for securing 1st place`);
      }
      if (isValid(winnerHouse2)) {
         winnerParts.push(`${winnerHouse2} House for 2nd`);
      }
      // Note: Added 3rd place for team games for consistency
      if (isValid(winnerHouse3)) {
         winnerParts.push(`${winnerHouse3} House for 3rd`);
      }
   }

   // Handle case with no valid winners provided
   if (winnerParts.length === 0) {
      return `Cheers for the great effort in ${game}! <br><br>🏅 Well done, participants! 🏅`;
   }

   const winnerString = formatList(winnerParts);
   const championsText = winnerParts.length > 1 ? 'champions' : 'champion';

   return `Cheers to ${winnerString} in ${game}! <br><br>🏅 Well done, ${championsText}! 🏅`;
}


// Function to randomly pick a congratulatory word or phrase
function getRandomCongratulatoryWord() {
   const randomIndex = Math.floor(Math.random() * congratulatoryWords.length);
   return congratulatoryWords[randomIndex];
}

// Function to download data as a file
function downloadFile(data, fileName, mimeType) {
   const blob = new Blob([data], {
      type: mimeType
   });
   const url = URL.createObjectURL(blob);
   const anchor = document.createElement('a');
   anchor.href = url;
   anchor.download = fileName;
   document.body.appendChild(anchor); // Append to the DOM for compatibility
   anchor.click();
   document.body.removeChild(anchor); // Clean up the DOM
   URL.revokeObjectURL(url); // Release the object URL
}

// Event listener for downloading files
downloadBtn.addEventListener('click', () => {
   // Generate CSV content from table
   const winnersTable = document.getElementById('winnersTable');
   const csvContent = Array.from(winnersTable.rows)
      .map(row => Array.from(row.cells)
         .map(cell => `"${cell.textContent}"`)
         .join(','))
      .join('\n');

   // Prepare JSON content
   const jsonContent = JSON.stringify({
      'Previous Total': prevHouseTotals,
      winners: winners
   }, null, 2);

   // Download files with a slight delay between them
   downloadFile(csvContent, 'winners.csv', 'text/csv');
   setTimeout(() => {
      downloadFile(jsonContent, 'winners.json', 'application/json');
   }, 100); // 100ms delay
});

function processClassString(str) {
   let num1, num2;

   // Check if the string is a range ("X to Y") or a single number ("X")
   if (str.includes(" to ")) {
      const parts = str.split(" to ");
      num1 = parseInt(parts[0], 10);
      num2 = parseInt(parts[1], 10);
   } else {
      // Treat a single number as a range from itself to itself
      num1 = parseInt(str, 10);
      num2 = num1;
   }

   // Handle cases where parsing failed (e.g., "apple" or "1 to blue")
   if (isNaN(num1) || isNaN(num2)) {
      return "NA";
   }

   // Check if the *entire* range [num1, num2] fits within the first group [3, 6]
   if (num1 >= 3 && num2 <= 6) {
      return "3 to 6";
   }

   // Check if the *entire* range [num1, num2] fits within the second group [7, 12]
   if (num1 >= 7 && num2 <= 12) {
      return "7 to 12";
   }

   // If it doesn't fit in any group
   return "NA";
}

function getPointsForPosition(gameType, position) {
   return pointCriteria[gameType][position - 1];
}

/**
 * Checks if a value is valid (not falsy and not 'NIL').
 * @param {string} value - The winner name or house name.
 * @returns {boolean}
 */
const isValid = (value) => value && value !== 'NIL';

/**
 * Formats an array of strings into a natural list.
 * e.g., ["A"] -> "A"
 * e.g., ["A", "B"] -> "A and B"
 * e.g., ["A", "B", "C"] -> "A, B, and C"
 * @param {string[]} parts - An array of winner description strings.
 * @returns {string} A grammatically correct, formatted string.
 */
function formatList(parts) {
   if (parts.length === 0) return '';
   if (parts.length === 1) return parts[0];
   if (parts.length === 2) return parts.join(' and ');
   // For 3 or more (though we only have 3)
   return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function calculateScores(winners) {
   // Initialize the scores object
   const scores = {
      'Total': {
         'Ruby': 0,
         'Emerald': 0,
         'Sapphire': 0,
         'Topaz': 0
      },
      'Previous Total': prevHouseTotals
   };

   // Add previous totals to the house totals
   for (const house in scores.Total) {
      scores.Total[house] += scores['Previous Total'][house];
   }

   // Function to add points to one or more houses
   function addPoints(scoreObj, house, points) {
      // Split the house string by "/" (if present in case of ties between two houses) and trim whitespace from each house name
      const houseArray = house.split("/").map(item => item.trim());
      // points = points / houseArray.length;

      // Iterate over the house names and update the scores
      houseArray.forEach(houseName => {
         // Initialize the house score if it doesn't exist
         if (!scoreObj[houseName]) {
            scoreObj[houseName] = 0;
         }
         // Add the specified points
         scoreObj[houseName] += points;
      });
   }

   // Iterate through each winner entry
   winners.forEach(entry => {
      const category = processClassString(entry.classcategory);

      // Initialize the category in the scores object if not already present
      if (!scores[category]) {
         scores[category] = {
            'Ruby': 0,
            'Emerald': 0,
            'Sapphire': 0,
            'Topaz': 0
         };
      }

      // Add points for winner1, winner2, and winner3
      addPoints(scores[category], entry.winnerhouse1, getPointsForPosition(entry.gametype, 1));
      addPoints(scores[category], entry.winnerhouse2, getPointsForPosition(entry.gametype, 2));
      addPoints(scores[category], entry.winnerhouse3, getPointsForPosition(entry.gametype, 3));

      // Add points to the total as well
      addPoints(scores.Total, entry.winnerhouse1, getPointsForPosition(entry.gametype, 1));
      addPoints(scores.Total, entry.winnerhouse2, getPointsForPosition(entry.gametype, 2));
      addPoints(scores.Total, entry.winnerhouse3, getPointsForPosition(entry.gametype, 3));
   });
   return scores;
}


// function to count winner houses
function countWinnerHouses(winners) {
   const winnerCounts = {};

   // Initialize the "Total" category
   winnerCounts["Total"] = {
      'Ruby': 0,
      'Topaz': 0,
      'Emerald': 0,
      'Sapphire': 0
   };

   // Loop through each winner entry
   winners.forEach(entry => {
      let {
         classcategory,
         winnerhouse1
      } = entry;

      // Parse class into correct class category
      classcategory = processClassString(classcategory)

      // Initialize the class category in the result object if not already present
      if (!winnerCounts[classcategory]) {
         winnerCounts[classcategory] = {
            'Ruby': 0,
            'Topaz': 0,
            'Emerald': 0,
            'Sapphire': 0
         };
      }

      // Increment the count for the house in the class category
      if (winnerCounts[classcategory][winnerhouse1] !== undefined) {
         winnerCounts[classcategory][winnerhouse1]++;
      }

      // Increment the count for the house in the "Total" category
      if (winnerCounts["Total"][winnerhouse1] !== undefined) {
         winnerCounts["Total"][winnerhouse1]++;
      }
   });

   return winnerCounts;
}

// function to animate to the new score while updating the dashboard 
function updateScoreWithAnimation(element, newContent) {
   // Parse the current score and new content as integers
   let oldScore = parseInt(element.textContent, 10);
   let newScore = parseInt(newContent, 10);

   // if new score is same as old score, do nothing
   if (oldScore === newScore) {
      return;
   }

   // Determine the direction of counting (up or down)
   let step = oldScore < newScore ? 1 : -1;

   // Create an interval to update the score step by step
   let interval = setInterval(() => {
      oldScore += step;
      element.textContent = oldScore;

      // Stop the interval once we reach the new score
      if (oldScore === newScore) {
         clearInterval(interval);
      }
   }, 10); // Delay between each update for the animation effect
}


// function to rank houses based on their total scores
function rankHouses(score) {
   // Remove the "NIL" key if it exists
   delete score['NIL'];

   // Convert the score object to an array of [house, score] pairs
   let scoreArray = Object.entries(score);

   // Sort the array in descending order of scores
   scoreArray.sort((a, b) => b[1] - a[1]);

   // Create a rank object
   let rank = {};
   scoreArray.forEach((item, index) => {
      rank[item[0]] = index + 1;
   });

   return rank;
}

// function to dynamically reorder house score tiles based on their current ranks
function updateTileOrder(ranks, container) {
   const tilesContainer = document.querySelector(`.${container}`);
   if (!tilesContainer) return;
   const tiles = Array.from(tilesContainer.children);

   // Filter out hidden tiles (e.g., "NIL")
   const visibleTiles = tiles.filter(tile => !tile.classList.contains("hidden"));

   // Sort the visible tiles based on the ranks object
   visibleTiles.sort((a, b) => {
      const houseA = a.classList.contains('ruby') ? 'Ruby' :
         a.classList.contains('emerald') ? 'Emerald' :
         a.classList.contains('sapphire') ? 'Sapphire' :
         a.classList.contains('topaz') ? 'Topaz' : null;
      const houseB = b.classList.contains('ruby') ? 'Ruby' :
         b.classList.contains('emerald') ? 'Emerald' :
         b.classList.contains('sapphire') ? 'Sapphire' :
         b.classList.contains('topaz') ? 'Topaz' : null;

      return ranks[houseA] - ranks[houseB];
   });

   // Append the visible tiles back in sorted order
   visibleTiles.forEach(tile => tilesContainer.appendChild(tile));
}


// function to update the dashboard 
function updateDashboard(scores) {

   // Loop through each class category in the scores object
   for (const classcategory in scores) {

      // Format the class category and house into the ID pattern
      const formattedCategory = classcategory.toLowerCase().replace(/ /g, '_');

      // Get the house counts for the current category
      const subtotals = scores[classcategory];

      // Get ranks for all houses
      const ranks = rankHouses(subtotals);

      // Dynamically re-order the score tiles based on ranks
      updateTileOrder(ranks, `tiles_${formattedCategory}`)

      // Update rank labels for all houses
      for (const [house, rank] of Object.entries(ranks)) {
         // Find the rank label element
         const id = `${house.toLowerCase()}_${formattedCategory}_rank`;
         const element = document.getElementById(id);
         let ordinalVal;
         switch (rank) {
            case 1:
               ordinalVal = 'First';
               break;
            case 2:
               ordinalVal = 'Second';
               break;
            case 3:
               ordinalVal = 'Third';
               break;
            case 4:
               ordinalVal = 'Fourth';
               break;
            default:
               ordinalVal = undefined;
         }
         if (element && ordinalVal) {
            element.innerText = ordinalVal;
         }
      }

      // Loop through each house in the subtotals object
      for (const house in subtotals) {

         const id = `${house.toLowerCase()}_${formattedCategory}`;

         // Find the HTML element by the ID
         const element = document.getElementById(id);

         // If the element exists, update its content
         if (element) {
            updateScoreWithAnimation(element, subtotals[house]);
         } else {
            console.warn(`Element with ID "${id}" not found.`);
         }
      }
   }
}


function addNewRow(winner) {
   const winnersTableBody = document.getElementById('winnersTableBody');

   const row = document.createElement('tr');
   row.id = 'row' + winner.row_id;
   row.innerHTML = `
             <td>${formatGameName(winner.game)}</td>
             <td>${winner.classcategory}</td>
             <td>${formatWinnerName(winner.winner1)}</td>
             <td>${formatWinnerName(winner.winner2)}</td>
             <td>${formatWinnerName(winner.winner3)}</td>
             <td>${winner.winnerhouse1}</td>
             <td>${winner.winnerhouse2}</td>
             <td>${winner.winnerhouse3}</td>
           `;
   winnersTableBody.prepend(row);

}


function updateExistingRow(winner) {

   const row = document.getElementById('row' + winner.row_id);

   row.innerHTML = `
             <td>${formatGameName(winner.game)}</td>
             <td>${winner.classcategory}</td>
             <td>${formatWinnerName(winner.winner1)}</td>
             <td>${formatWinnerName(winner.winner2)}</td>
             <td>${formatWinnerName(winner.winner3)}</td>
             <td>${winner.winnerhouse1}</td>
             <td>${winner.winnerhouse2}</td>
             <td>${winner.winnerhouse3}</td>
           `;

}


function updateWinner(rowID, newWinnerData) {
   // Find the index of the object with the matching row_id
   const index = winners.findIndex(winner => winner.row_id === rowID);

   // If the object is found, update it with the newWinnerData
   if (index !== -1) {
      winners[index] = {
         ...winners[index],
         ...newWinnerData
      };
   } else {
      console.log(`Row with ID ${rowID} not found.`);
   }
}

function handleLiveUpdate(payload) {
   if (payload.eventType === 'INSERT') {
      winners.push(payload.new);
      addNewRow(payload.new);
      setHeadlineAndPopupAfterWin(payload.new, 'both');
   } else if (payload.eventType === 'UPDATE') {
      updateWinner(payload.new.row_id, payload.new);
      updateExistingRow(payload.new);
      setHeadlineAndPopupAfterWin(payload.new, 'both');
   }

   const winnerCounts = calculateScores(winners);
   updateDashboard(winnerCounts);
   updatePredictionBar(predictWinPercentage(winnerCounts.Total));

}

function updateScrollingText(newText = defaultHeadline, stayAlive = 43200000) {

   const scrollingTextElement = document.getElementById('scrollingText');

   // Update the scrolling text
   scrollingTextElement.innerHTML = newText;

   // Remove the headlines after a set duration
   setTimeout(resetHeadline, stayAlive);
}

// function to reset the headline back to the default welcome headline
function resetHeadline() {
   document.getElementById('scrollingText').innerHTML = defaultHeadline;
}

// helper function to remove the class category part from the game name for a cleaner string
function formatGameName(input) {
   // Split the string at the "|" symbol
   const parts = input.split('|');

   // If there's a "|" symbol, return the substring after it, trimmed
   return parts.length > 1 ? parts[1].trim() : input;
}

// helper function to format winner name so that class is always displayed in the next line
function formatWinnerName(str) {
   const match = str.match(/\((?:Class\s)?\d+(?:-\w+)?\)$/i);
   return match ? str.replace(match[0], `<br>${match[0]}`) : str;
}

// helper function to capitalize first letter of each word
function capitalizeFirstLetter(string) {
   return string
      .toLowerCase() // Convert the entire string to lowercase
      .split(' ') // Split the string into an array of words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
      .join(' '); // Join the array of words back into a single string
}

// helper function to determine game type (individual or team)
function getGameType(game) {
   const gameName = game.toLowerCase();
   // Check if the game is team game based on keywords
   const teamKeywords = ["kho kho", "kabaddi", "rollball", "basketball", "handball"];
   if (teamKeywords.some(keyword => gameName.includes(keyword))) {
      return 'team';
   } else {
      return 'individual';
   }
}

/**
 * Function to generate the live scrolling headline, 
 * handling missing winners gracefully.
 */
function generateLiveWinHeadline() {
   const table = document.getElementById("winnersTable");
   const tableBody = table.querySelector("tbody");
   const rows = tableBody ? tableBody.querySelectorAll("tr") : [];

   if (rows.length === 0) {
      return; // Do nothing if the table is empty
   }

   const lastRows = Array.from(rows).slice(-3).reverse();

   const headlines = lastRows.map(row => {
      const game = row.cells[0].textContent.trim();
      const classGroup = row.cells[1].textContent.trim();
      const winner1 = row.cells[2].textContent.trim();
      const winner2 = row.cells[3].textContent.trim();
      const winner3 = row.cells[4].textContent.trim();
      const winnerHouse1 = row.cells[5].textContent.trim();
      const winnerHouse2 = row.cells[6].textContent.trim();
      const winnerHouse3 = row.cells[7].textContent.trim();

      const headlineParts = [];
      let headlinePrefix = '';

      if (getGameType(game) === 'team') {
         headlinePrefix = `<strong>${game}</strong> Results (Classes ${classGroup}):`;
         if (isValid(winnerHouse1)) headlineParts.push(`${winnerHouse1} clinches 1st`);
         if (isValid(winnerHouse2)) headlineParts.push(`${winnerHouse2} bags 2nd`);
         if (isValid(winnerHouse3)) headlineParts.push(`${winnerHouse3} secures 3rd position`);
      } else { // Individual game
         headlinePrefix = `<strong>${game} Results (Class ${classGroup}):</strong>`;
         if (isValid(winner1) && isValid(winnerHouse1)) headlineParts.push(`${winner1} from ${winnerHouse1} house clinches 1st`);
         if (isValid(winner2) && isValid(winnerHouse2)) headlineParts.push(`${winner2} from ${winnerHouse2} house bags 2nd`);
         if (isValid(winner3) && isValid(winnerHouse3)) headlineParts.push(`${winner3} from ${winnerHouse3} house secures 3rd position`);
      }

      // If no valid winners were found for this row, return an empty string
      if (headlineParts.length === 0) {
         return '';
      }

      // Combine the prefix and the formatted list of winners
      return `${headlinePrefix} ${formatList(headlineParts)}.`;

   });

   // Filter out any empty strings (from rows with no winners) before joining
   return headlines.filter(h => h).join("   |   ");
}


function handleNotifications(payload) {
   if (payload.eventType === 'INSERT' && payload.new) {
      const {
         type,
         heading,
         content
      } = payload.new;

      if (type === 'headline' || type === 'both') {
         const combined = `<strong>${heading}: </strong>${content}`;
         updateScrollingText(combined);
      }
      if (type === 'popup' || type === 'both') {
         showPopup(heading, content, false, 120000);
      }
   }
}

// Function to get URL parameters
function getParameterByName(name, url) {
   if (!url) url = window.location.href;
   name = name.replace(/[[\]]/g, '\\$&');
   var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
   if (!results) return null;
   if (!results[2]) return '';
   return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Function to fetch saved results of past sessions stored as JSON files
async function fetchSavedResult(url) {
   try {
      const response = await fetch(url);
      if (!response.ok) {
         throw new Error("Network response was not ok " + response.statusText);
      }
      const data = await response.json();
      return data;
   } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      return null; // Return null in case of an error
   }
}

// Function to format the timestamp to be displayed in the tooltip when a winner row is hovered upon
function formatTimestamp(timestamp) {
   const date = new Date(timestamp);
   const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
   };
   return date.toLocaleString('en-US', options);
}

// Adding hover functionality to the rows to display the time the result was recorded
document.addEventListener('DOMContentLoaded', () => {

   const table = document.getElementById('winnersTable');

   // Create a tooltip div
   const tooltip = document.createElement('div');
   tooltip.id = 'resultTimestamp';
   tooltip.style.position = 'absolute';
   tooltip.style.padding = '8px';
   tooltip.style.background = '#333';
   tooltip.style.color = '#fff';
   tooltip.style.borderRadius = '4px';
   tooltip.style.fontSize = '12px';
   tooltip.style.display = 'none';
   tooltip.style.zIndex = '50';
   tooltip.style.pointerEvents = 'none';
   tooltip.style.transform = 'translateY(-10px)';
   tooltip.style.whiteSpace = 'nowrap';
   document.body.appendChild(tooltip);

   // Function to update the tooltip position and keep it within the viewport
   function updateTooltipPosition(event) {
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = event.pageX + 20;
      let top = event.pageY + 35;

      // Adjust if the tooltip goes beyond the right edge of the viewport
      if (left + tooltipRect.width > viewportWidth) {
         left = viewportWidth - tooltipRect.width - 40; // Add some padding
      }

      // Update the tooltip's position
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
   }

   table.addEventListener('mouseover', (event) => {
      const row = event.target.closest('tr');
      if (row && row.id && row.id.startsWith('row')) {
         const rowId = parseInt(row.id.replace('row', ''), 10);
         const winner = winners.find(w => w.row_id === rowId);

         if (winner) {
            tooltip.textContent = `Result recorded on ${formatTimestamp(winner.timestamp)}`;
            tooltip.style.display = 'block';
         }
      }
   });

   table.addEventListener('mousemove', (event) => {
      updateTooltipPosition(event);
   });

   table.addEventListener('mouseout', (event) => {
      tooltip.style.display = 'none';
   });
});


window.addEventListener('load', async function () {
   const isLive = await pollEntireData();
   if (isLive) {
      const subscription = subscribeToTable('sport_winners', handleLiveUpdate);
      const subscription2 = subscribeToTable('sport_notifications', handleNotifications);
   }
});

/**
 * Updates the win prediction bar with new percentages.
 * The bar will automatically sort and animate the widths.
 *
 * @param {object} predictions - An object with house names as keys
 * and percentages as values.
 * e.g., { Ruby: 19, Emerald: 27, Sapphire: 31, Topaz: 23 }
 */
function updatePredictionBar(predictions) {
   // 1. Convert object to an array: [['Sapphire', 31], ['Emerald', 27], ...]
   const sortedHouses = Object.entries(predictions)
      .sort(([, percentA], [, percentB]) => percentB - percentA);

   // 2. Get the container
   const container = document.getElementById('prediction-bar-container');
   if (!container) {
      console.error('Prediction bar container not found!');
      return;
   }

   // 3. Update each strip
   sortedHouses.forEach(([houseName, percentage], index) => {
      // Build the element ID from the house name
      const elementId = `${houseName.toLowerCase()}-strip`;
      const element = document.getElementById(elementId);

      if (element) {
         // Update the width (flex-basis)
         element.style.flexBasis = `${percentage}%`;

         // Update the visual order
         // The house with the highest score (index 0) gets order 0
         element.style.order = index;

         // Update the text
         const span = element.querySelector('span');
         if (span) {
            // Hide text if the percentage is too small to display clearly
            if (percentage < 4) {
               span.textContent = '';
            } else {
               span.textContent = `${houseName} ${percentage}%`;
            }
         }
      }
   });
}

function predictWinPercentage(houseScores) {
   // --- 1. Calculate Completed Games ---
   let completedGames = {
      Individual: 0,
      Grouped: 0,
      Team: 0
   };
   // Ensure 'winners' is defined, default to empty array if not
   const gameWinners = typeof winners !== 'undefined' ? winners : [];
   for (const game of gameWinners) {
      if (game.gametype in completedGames) {
         completedGames[game.gametype]++;
      }
   }

   // --- 2. Calculate Remaining Games ---
   let remainingGames = {
      Individual: totalEvents.Individual - completedGames.Individual,
      Grouped: totalEvents.Grouped - completedGames.Grouped,
      Team: totalEvents.Team - completedGames.Team,
   };

   // --- 3. Calculate Total Remaining Potential Points ---
   // (Max points for 1st place in each *remaining* game)
   const maxPointsInd = pointCriteria.Individual[0]; // 10
   const maxPointsGrp = pointCriteria.Grouped[0]; // 10
   const maxPointsTeam = pointCriteria.Team[0]; // 20

   let totalRemainingPotential =
      (remainingGames.Individual * maxPointsInd) +
      (remainingGames.Grouped * maxPointsGrp) +
      (remainingGames.Team * maxPointsTeam);

   // --- 4. Calculate Total Current Points ---
   let totalPoints = 0;
   const houses = Object.keys(houseScores); // ["Ruby", "Emerald", ...]
   for (const house of houses) {
      totalPoints += houseScores[house];
   }

   // --- 5. Handle Edge Case: No games played ---
   // If no scores are in, prediction is an even split.
   if (totalPoints === 0) {
      return {
         "Ruby": 25,
         "Emerald": 25,
         "Sapphire": 25,
         "Topaz": 25
      };
   }

   // --- 6. Identify Winnable Houses (Elimination Check) ---
   // Find the current leader's score.
   const maxCurrentScore = Math.max(...Object.values(houseScores));

   let winnableHouses = {}; // {Ruby: 27, Emerald: 25}
   let eliminatedHouses = {}; // {Topaz: 12}

   for (const house of houses) {
      // Calculate the absolute maximum score this house can achieve.
      const maxPossibleScore = houseScores[house] + totalRemainingPotential;

      // If a house's max potential score is less than the *current*
      // score of the leader, they are mathematically eliminated.
      if (maxPossibleScore < maxCurrentScore) {
         eliminatedHouses[house] = 0;
      } else {
         winnableHouses[house] = houseScores[house];
      }
   }

   // --- 7. Handle 100% Win Scenario ---
   const winnableCount = Object.keys(winnableHouses).length;

   if (winnableCount === 1) {
      const winningHouse = Object.keys(winnableHouses)[0];
      let finalPercentages = {
         ...eliminatedHouses
      }; // {Topaz: 0, Sapphire: 0}
      finalPercentages[winningHouse] = 100;
      return finalPercentages; // e.g., {Ruby: 0, Emerald: 100, Sapphire: 0, Topaz: 0}
   }

   // --- 8. Calculate "Adjusted Scores" for Probability ---
   // Distribute the remaining potential *only* among the houses still in the running.
   const potentialPerWinnableHouse = totalRemainingPotential / winnableCount;

   let adjustedScores = {};
   let totalAdjustedScore = 0;

   for (const house of houses) {
      if (house in winnableHouses) {
         // This house can win. Its "score" is its current score + its share of the potential.
         const adjusted = houseScores[house] + potentialPerWinnableHouse;
         adjustedScores[house] = adjusted;
         totalAdjustedScore += adjusted; // Add to the new "total" pool
      } else {
         // This house is eliminated. Its "score" in the probability pool is 0.
         adjustedScores[house] = 0;
      }
   }

   // --- 9. Calculate Percentages using Largest Remainder Method ---
   // This part is from your original function, but now uses the
   // 'adjustedScores' and 'totalAdjustedScore'.

   let percentages = {};
   let remainders = [];
   let flooredSum = 0;

   // This check prevents division by zero, though it's already
   // handled by the totalPoints === 0 check earlier.
   if (totalAdjustedScore === 0) {
      return {
         "Ruby": 25,
         "Emerald": 25,
         "Sapphire": 25,
         "Topaz": 25
      };
   }

   for (const house in adjustedScores) {
      const precisePercentage = (adjustedScores[house] / totalAdjustedScore) * 100;
      const flooredPercentage = Math.floor(precisePercentage);

      percentages[house] = flooredPercentage;
      flooredSum += flooredPercentage;

      remainders.push({
         house: house,
         remainder: precisePercentage - flooredPercentage
      });
   }

   // Sort houses by their decimal remainder, descending
   remainders.sort((a, b) => b.remainder - a.remainder);

   // Calculate the number of '1's to distribute (100 - sum of floored)
   let difference = 100 - flooredSum;

   // Distribute the remaining percentage points
   for (let i = 0; i < difference; i++) {
      if (remainders[i]) { // Safeguard against rounding errors
         percentages[remainders[i].house]++;
      }
   }

   return percentages;
}

// Set initial win predictions
// Run this when the page loads to set an initial state
document.addEventListener('DOMContentLoaded', () => {
   const initialState = {
      Ruby: 25,
      Emerald: 25,
      Sapphire: 25,
      Topaz: 25
   };
   updatePredictionBar(initialState);
});

/**
 * Triggers the confetti celebration using the custom canvas.
 */
function launchConfetti() {
   // 1. Select your specific canvas element
   const canvas = document.getElementById('confetti-canvas');

   // 2. Create a confetti instance bound to that canvas
   const myConfetti = confetti.create(canvas, {
      resize: true, // Will fit the canvas to the window
      useWorker: true
   });

   const count = 200;
   const defaults = {
      origin: {
         y: 0.7
      }
   };

   function fire(particleRatio, opts) {
      // 3. Use 'myConfetti' instead of the global 'confetti'
      myConfetti(Object.assign({}, defaults, opts, {
         particleCount: Math.floor(count * particleRatio)
      }));
   }

   fire(0.25, {
      spread: 26,
      startVelocity: 55,
   });

   fire(0.2, {
      spread: 60,
   });

   fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
   });

   fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
   });

   fire(0.1, {
      spread: 120,
      startVelocity: 45,
   });
}

function countActiveEvents(eventList) {
  // Initialize the counter object with 0s to ensure specific keys exist
  const initialCounts = {
    Individual: 0,
    Grouped: 0,
    Team: 0
  };

  return eventList.reduce((acc, event) => {
    // Check if the event should be included
    if (event.included_in_total === true) {
      // Check if the game_type exists in our accumulator (to prevent errors if bad data comes in)
      if (acc.hasOwnProperty(event.game_type)) {
        acc[event.game_type] += 1;
      }
    }
    return acc;
  }, initialCounts);
}
