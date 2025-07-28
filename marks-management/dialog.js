const loadingPhrases = [
  "Dusting off the textbooks...",
  "Marking lesson boundaries...",
  "Chalking out the chapters...",
  "Stacking up study goals...",
  "Unrolling the academic scroll...",
  "Whispering secrets to the timetable...",
  "Filing the knowledge cabinets...",
  "Packing bags with fresh chapters...",
  "Assembling learning adventures...",
  "Highlighting the important stuff...",
  "Spinning the syllabus wheel...",
  "Planting ideas for young minds...",
  "Mapping the journey to excellence...",
  "Setting the syllabus compass...",
  "Curating a season of studies...",
  "Turning pages before they’re opened...",
  "Hanging subjects on the notice board...",
  "Warming up the curriculum engines...",
  "Drawing the blueprint of brilliance...",
  "Arranging the subjects in perfect harmony..."
];

// Function to select a random phrase
function getRandomLoadingPhrase() {
   const randomIndex = Math.floor(Math.random() * loadingPhrases.length);
   return loadingPhrases[randomIndex];
}


// Attach showDialog function to the global window object
window.showDialog = function ({
   title,
   message,
   type
}, showRandomPhrase = true) {
   return new Promise((resolve) => {
      // Access the elements
      const overlay = document.getElementById('dialog-overlay');
      const dialogBox = document.getElementById('dialog-box');
      const dialogHeader = document.getElementById('dialog-header');
      const dialogMessage = document.getElementById('dialog-message');
      const dialogButtons = document.getElementById('dialog-buttons');

      // Clear existing buttons and message
      dialogButtons.innerHTML = '';
      dialogMessage.innerHTML = '';

      // remove processing specific classes
      dialogBox.classList.remove('dialog-minimal-padding');

      // Set the content
      dialogHeader.textContent = title;

      if (type === 'confirm') {
         dialogMessage.textContent = message;

         const yesButton = document.createElement('button');
         yesButton.textContent = 'Yes';
         yesButton.classList.add('dialog-button', 'button-yes');
         yesButton.onclick = () => {
            closeDialog();
            resolve(true);
         };

         const noButton = document.createElement('button');
         noButton.textContent = 'No';
         noButton.classList.add('dialog-button', 'button-no');
         noButton.onclick = () => {
            closeDialog();
            resolve(false);
         };

         dialogButtons.appendChild(yesButton);
         dialogButtons.appendChild(noButton);
      } else if (type === 'alert') {
         dialogMessage.textContent = message;

         const okButton = document.createElement('button');
         okButton.textContent = 'Ok';
         okButton.classList.add('dialog-button', 'button-ok');
         okButton.onclick = () => {
            closeDialog();
            resolve(true);
         };

         dialogButtons.appendChild(okButton);
      } else if (type === 'processing') {
         const loadingPhrase = showRandomPhrase ? getRandomLoadingPhrase() : 'Processing...';
         dialogBox.classList.add('dialog-minimal-padding');
         dialogMessage.classList.add('dialog-processing');
         dialogMessage.innerHTML = `<img src="https://sourabhsuneja.github.io/jvp-sports-meet/images/loading.gif" style="height: 30px"> ${loadingPhrase}`;
      }

      // Show the dialog
      overlay.classList.add('show');

      // Function to close the dialog
      function closeDialog() {
         overlay.classList.remove('show');
         dialogMessage.classList.remove('dialog-processing');
      }
   });
};

// Attach showProcessingDialog and hideProcessingDialog functions to the global window object
window.showProcessingDialog = function (showRandomPhrase = true) {
   window.showDialog({
      title: '',
      type: 'processing'
   }, showRandomPhrase);
};

window.hideProcessingDialog = function () {
   document.getElementById('dialog-overlay').classList.remove('show');
};
