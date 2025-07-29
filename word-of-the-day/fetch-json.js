// testing purpose
// var selectedWords = [];
// var selectedSources = [];



// Array of JSON file sources
var jsonSources = ['data1.json', 'data2.json', 'data3.json', 'data4.json', 'data5.json', 'data6.json', 'data7.json', 'data8.json']; // Add more sources as needed
var jsonDataCache = {}; // Cache to store pre-loaded JSON data


// Shuffle array function
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to fetch and cache JSON data
function fetchAndCacheJsonData(source) {
    return fetch(source)
        .then(response => response.json())
        .then(jsonData => {
            jsonDataCache[source] = jsonData;
       jsonDataCache[source].words = shuffleArray(jsonDataCache[source].words);
        })
        .catch(error => console.error(`Error fetching JSON from ${source}:`, error));
}

// Use Promise.all to wait for all fetch operations to complete
Promise.all(jsonSources.map(source => fetchAndCacheJsonData(source)))
    .then(() => {
        // All JSON files have been fetched and cached

        // Attach event handler after all JSON files have been loaded
        document.getElementById('loadFromJson').addEventListener('click', function () {
            // Check if the useJsonData checkbox is checked
            var useJsonDataCheckbox = document.getElementById('useJsonData');

            if (useJsonDataCheckbox.checked) {
                // Event handler logic when the checkbox is checked

                // Randomly select a JSON file source
                var randomSource = jsonSources[Math.floor(Math.random() * jsonSources.length)];

                // Use the pre-loaded JSON data from the cache
                var jsonData = jsonDataCache[randomSource];

                if (jsonData) {
                    // Pick a random word
                    var randomIndex = Math.floor(Math.random() * jsonData.words.length);
                    var randomWord = jsonData.words[randomIndex];

                    // Insert data into corresponding input fields
                    document.getElementById('word').value = randomWord.word;
                    document.getElementById('meaning').value = randomWord.meaning;
                    document.getElementById('synonym').value = randomWord.synonym;
                    document.getElementById('antonym').value = randomWord.antonym;
                    document.getElementById('sentence').value = randomWord.sentence;
                    document.getElementById('pronunciation').value = randomWord.pronunciation;

// re-shuffle word array after fetching a word
jsonDataCache[randomSource].words = shuffleArray(jsonDataCache[randomSource].words);


// testing purpose
// selectedSources.push(randomSource);
// selectedWords.push(randomWord.word);

                } else {
                    console.error(`Error: JSON data for ${randomSource} not pre-loaded.`);
                }
            } else {
                // Alert if the checkbox is not checked
                alert('Please check the "Use pre-loaded JSON data" checkbox first.');
            }
        });

        // Trigger click on loadFromJson button
        var useJsonDataCheckbox = document.getElementById('useJsonData');
        if (useJsonDataCheckbox.checked) {
            document.getElementById('loadFromJson').click();
        }
    })
    .catch(error => console.error('Error fetching JSON:', error));






/*

document.addEventListener("DOMContentLoaded", function() {
    // Assuming you have these arrays already initialized in your code
    
    // Function to generate CSV content
    function generateCSV(selectedWords, selectedSources) {
        let csvContent = "Word,Source\n";
        for (let i = 0; i < selectedWords.length; i++) {
            csvContent += `${selectedWords[i]},${selectedSources[i]}\n`;
        }
        return csvContent;
    }
    
    // Function to force download CSV
    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    // Check array length and generate CSV when it reaches 100
    setInterval(function() {
        if (selectedWords.length >= 500) {
            const csvContent = generateCSV(selectedWords, selectedSources);
            downloadCSV(csvContent, "selectedData.csv");
        }
    }, 500); // Check every half second
});



document.addEventListener("DOMContentLoaded", function() {
    setInterval(function() {
        var loadButton = document.getElementById('loadFromJson');
        loadButton.click();
    }, getRandomInterval());
});

function getRandomInterval() {
    return Math.floor(Math.random() * (3000 - 1000) + 1000); // Random interval between 1000ms and 3000ms
}

*/
