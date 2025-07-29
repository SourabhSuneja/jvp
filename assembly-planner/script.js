const PASSKEY = "jvp123";
let assemblies = [];
let additionalRolesCount = 0;

const authForm = document.getElementById('authForm');
const schedulerForm = document.getElementById('schedulerForm');
const upcomingAssemblies = document.getElementById('upcomingAssemblies');
const passKeyInput = document.getElementById('passkey');
const authenticateBtn = document.getElementById('authenticateBtn');
const assemblyForm = document.getElementById('assemblyForm');
const conductingClassSelect = document.getElementById('conductingClass');
const addRoleBtn = document.getElementById('addRoleBtn');
const additionalRolesDiv = document.getElementById('additionalRoles');
const assembliesTableBody = document.getElementById('assembliesTableBody');
const emptyState = document.getElementById('emptyState');
const aiModal = document.getElementById('aiModal');
const closeAiModal = document.getElementById('closeAiModal');
const aiOptions = document.getElementById('aiOptions');
const aiModalTitle = document.getElementById('aiModalTitle');
const aiModalDescription = document.getElementById('aiModalDescription');
const toast = document.getElementById('toast');
const suggestThemeBtn = document.getElementById('suggestThemeBtn');
const suggestThoughtBtn = document.getElementById('suggestThoughtBtn');
const suggestWordBtn = document.getElementById('suggestWordBtn');
const aiAssistantModal = document.getElementById('aiAssistantModal');
const closeAiAssistantModal = document.getElementById('closeAiAssistantModal');
const aiResponseModal = document.getElementById('aiResponseModal');
const closeAiResponseModal = document.getElementById('closeAiResponseModal');
const aiResponseTitle = document.getElementById('aiResponseTitle');
const aiResponseContent = document.getElementById('aiResponseContent');
const copyResponseBtn = document.getElementById('copyResponseBtn');

let currentAssemblyData = null;

async function init() {
   populateClasses();
   await loadAssembliesFromServer();
   updateAssembliesTable();
   setupEventListeners();
}

function populateClasses() {
   const classes = [];
   for (let grade = 1; grade <= 12; grade++) {
      for (let section = 1; section <= 4; section++) {
         classes.push(`${grade}-A${section}`);
      }
   }

   classes.forEach(className => {
      const option = document.createElement('option');
      option.value = className;
      option.textContent = className;
      conductingClassSelect.appendChild(option);
   });
}

async function loadAssembliesFromServer() {
   const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

   assemblies = await selectData(
      "assemblies",
      false,
      "*",
      [],
      [],
      "date",
      "asc",
      [{
         column: "date",
         operator: "gte",
         value: today
      }]
   );
}

async function saveAssembliesToServer(newAssemblyData) {
   showProcessingDialog();
   const result = await upsertData("assemblies", newAssemblyData, ["date"]);

   if (result) {
      await showDialog({
         title: 'Success',
         message: 'Assembly schedule updated successfully!',
         type: 'alert'
      });
      showToast('Assembly schedule updated successfully!');
   } else {
      await showDialog({
         title: 'Error',
         message: 'Error updating assembly schedule!',
         type: 'alert'
      });
      showToast('Error updating assembly schedule!', 'error');
   }
   return result;
}

async function deleteFromServer(dateToDelete) {
   showProcessingDialog();
   const result = await deleteRow('assemblies', ['date'], [dateToDelete]);

   if (result) {
      await showDialog({
         title: 'Success',
         message: 'Assembly deleted successfully!',
         type: 'alert'
      });
      showToast('Assembly deleted successfully!');
   } else {
      await showDialog({
         title: 'Error',
         message: 'Error updating assembly schedule!',
         type: 'alert'
      });
      showToast('Error updating assembly schedule!', 'error');
   }
   return result;
}

function updateAssembliesTable() {
   assembliesTableBody.innerHTML = '';

   const sortedAssemblies = [...assemblies].sort((a, b) => new Date(a.date) - new Date(b.date));
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const futureAssemblies = sortedAssemblies.filter(assembly => new Date(assembly.date) >= today);
   const upcomingAssemblies = futureAssemblies.slice(0, 10);

   if (upcomingAssemblies.length === 0) {
      emptyState.classList.remove('hidden');
   } else {
      emptyState.classList.add('hidden');
   }

   upcomingAssemblies.forEach((assembly, index) => {
      const row = document.createElement('tr');
      const date = new Date(assembly.date);
      const formattedDate = date.toLocaleDateString('en-US', {
         weekday: 'short',
         year: 'numeric',
         month: 'short',
         day: 'numeric'
      });

      let additionalRolesHTML = '';
      if (assembly.additional_roles && assembly.additional_roles.length > 0) {
         additionalRolesHTML = assembly.additional_roles.map(role => `<span class="badge badge-secondary">${role.role}: ${role.student}</span>`).join(' ');
      } else {
         additionalRolesHTML = '—';
      }

      row.innerHTML = `
    <td>${formattedDate}</td>
    <td>${assembly.theme}</td>
    <td><span class="badge badge-primary">${assembly.conducting_class}</span></td>
    <td>${assembly.anchoring_by || '—'}</td>
    <td>${assembly.thought || '—'}</td>
    <td>${assembly.thought_by || '—'}</td>
    <td>${assembly.word_of_the_day || '—'}</td>
    <td>${assembly.word_student || '—'}</td>
    <td>${assembly.news_by || '—'}</td>
    <td>${additionalRolesHTML}</td>
    <td>
        <button class="btn btn-danger btn-sm" onclick="deleteAssembly('${assembly.date}')"><i class="fas fa-trash"></i></button>
        <button class="btn btn-primary btn-sm" onclick="showAiAssistantModal('${assembly.date}')"><i class="fas fa-robot"></i></button>
    </td>
`;
      assembliesTableBody.appendChild(row);
   });
}

function setupEventListeners() {
   authenticateBtn.addEventListener('click', handleAuthentication);
   assemblyForm.addEventListener('submit', handleFormSubmit);
   addRoleBtn.addEventListener('click', addRole);
   suggestThemeBtn.addEventListener('click', () => showAiSuggestions('theme'));
   suggestThoughtBtn.addEventListener('click', () => showAiSuggestions('thought'));
   suggestWordBtn.addEventListener('click', () => showAiSuggestions('word'));
   closeAiModal.addEventListener('click', hideAiModal);
   closeAiAssistantModal.addEventListener('click', hideAiAssistantModal);
   document.getElementById('scriptOption').addEventListener('click', () => handleAiAssistantOption('script'));
   document.getElementById('skitOption').addEventListener('click', () => handleAiAssistantOption('skit'));
   document.getElementById('suggestionOption').addEventListener('click', () => handleAiAssistantOption('suggestions'));
   closeAiResponseModal.addEventListener('click', hideAiResponseModal);
   copyResponseBtn.addEventListener('click', copyResponseToClipboard);
}

function handleAuthentication() {
   const enteredPasskey = passKeyInput.value.trim();
   if (enteredPasskey === PASSKEY) {
      authForm.classList.add('hidden');
      schedulerForm.classList.remove('hidden');
      upcomingAssemblies.classList.remove('hidden');
      showToast('Authentication successful!');
   } else {
      showToast('Invalid passkey! Please try again.', 'error');
      passKeyInput.value = '';
      passKeyInput.focus();
   }
}

async function handleFormSubmit(event) {
   event.preventDefault();

   const assemblyDate = document.getElementById('assemblyDate').value;
   const existingIndex = assemblies.findIndex(assembly => assembly.date === assemblyDate);


   if (assemblyDate) {
      const selectedDate = new Date(assemblyDate);
      const today = new Date();

      // Set the time portion to 00:00:00 for accurate date comparison
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
         showDialog({
            title: 'Error',
            message: "You can't schedule an assembly for a past date!",
            type: 'alert'
         });
         showToast("Can't schedule an assembly for a past date!", 'error');
         return;
      }
   }

   const newAssemblyData = {
      date: assemblyDate,
      theme: document.getElementById('theme').value.trim(),
      conducting_class: document.getElementById('conductingClass').value.trim(),
      anchoring_by: document.getElementById('anchorStudent').value.trim() || null,
      thought_by: document.getElementById('thoughtStudent').value.trim() || null,
      thought: document.getElementById('thought').value.trim() || null,
      word_student: document.getElementById('wordStudent').value.trim() || null,
      word_of_the_day: document.getElementById('word').value.trim() || null,
      news_by: document.getElementById('newsStudent').value.trim() || null,
      additional_roles: []
   };

   const roleEntries = document.querySelectorAll('.role-entry');
   roleEntries.forEach(entry => {
      const roleInput = entry.querySelector('.role-name');
      const studentInput = entry.querySelector('.role-student');

      if (roleInput.value && studentInput.value) {
         newAssemblyData.additional_roles.push({
            role: roleInput.value,
            student: studentInput.value
         });
      }
   });

   const success = await saveAssembliesToServer(newAssemblyData);

   if (!success) {
      return
   }

   if (existingIndex !== -1) {
      assemblies[existingIndex] = newAssemblyData;
   } else {
      assemblies.push(newAssemblyData);
   }

   updateAssembliesTable();
   assemblyForm.reset();
   resetAdditionalRoles();
}

async function deleteAssembly(dateToDelete) {

   const date = new Date(dateToDelete);
   const day = date.getDate();
   const month = date.toLocaleString('default', {
      month: 'long'
   });
   const year = date.getFullYear();

   // Function to get ordinal suffix
   const getOrdinal = (n) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
   };

   const formattedDate = `${getOrdinal(day)} ${month}, ${year}`;
   const message = 'Are you sure you want to delete the assembly scheduled for ' + formattedDate + '?';

   const confirmDelete = await showDialog({
      title: 'Confirm Delete',
      message: message,
      type: 'confirm'
   });

   if (confirmDelete) {
      const success = deleteFromServer(dateToDelete);
      if (success) {
         assemblies = assemblies.filter(assembly => assembly.date !== dateToDelete);
      } else {
         return;
      }
      updateAssembliesTable();
   }
}

function addRole() {
   additionalRolesCount++;
   if (additionalRolesDiv.classList.contains('hidden')) {
      additionalRolesDiv.classList.remove('hidden');
   }
   const roleEntry = document.createElement('div');
   roleEntry.className = 'role-entry';
   roleEntry.innerHTML = `
                 <input type="text" class="role-name" placeholder="Role Name" required>
                 <input type="text" class="role-student" placeholder="Student Name" required>
                 <span class="role-remove" onclick="removeRole(this)">
                     <i class="fas fa-times-circle"></i>
                 </span>
             `;
   additionalRolesDiv.appendChild(roleEntry);
}

function removeRole(element) {
   const roleEntry = element.parentElement;
   roleEntry.remove();
   additionalRolesCount--;
   if (additionalRolesCount === 0) {
      additionalRolesDiv.classList.add('hidden');
   }
}

function resetAdditionalRoles() {
   additionalRolesDiv.innerHTML = '';
   additionalRolesCount = 0;
   additionalRolesDiv.classList.add('hidden');
}

async function showAiSuggestions(type) {
   aiOptions.innerHTML = '';
   let title = '';
   let description = '';
   let suggestions = [];
   let prompt = '';
   let theme = document.getElementById('theme').value.trim();

   showProcessingDialog();
   

   switch (type) {
      case 'theme':
         title = 'Assembly Theme Suggestions';
         description = 'Select a theme for your assembly:';
         prompt = 'Suggest some unique themes for the school assembly, different from the previously suggested ones.';
         break;

      case 'thought':
         title = 'Thought of the Day Suggestions';
         description = 'Select a thought for your assembly:';
         prompt = theme 
  ? `Give some suggestions on "Thought of the Day" related to the theme "${theme}".` 
  : `Give some suggestions on "Thought of the Day".`;
         break;

      case 'word':
         title = 'Word of the Day Suggestions';
         description = 'Select a word for your assembly:';
         prompt = theme 
  ? `Give some suggestions on "Word of the Day" related to the theme "${theme}".` 
  : `Give some suggestions on "Word of the Day".`;
         break;
   }



   const response = await window.fetchResponse(prompt, 'assemblyElementHelp'); 
 
   suggestions = extractSuggestions(response);

   hideProcessingDialog();

   aiModalTitle.textContent = title;
   aiModalDescription.textContent = description;

   suggestions.forEach((suggestion, index) => {
      const option = document.createElement('div');
      option.className = 'ai-option';
      option.textContent = suggestion;
      option.addEventListener('click', () => {
         selectAiSuggestion(type, suggestion);
         hideAiModal();
      });
      aiOptions.appendChild(option);
   });

   aiModal.style.display = 'flex';
}

function hideAiModal() {
   aiModal.style.display = 'none';
}

function selectAiSuggestion(type, suggestion) {
   switch (type) {
      case 'theme':
         document.getElementById('theme').value = suggestion;
         break;

      case 'thought':
         document.getElementById('thought').value = suggestion;
         break;

      case 'word':
         const wordPart = suggestion.split(':')[0];
         document.getElementById('word').value = wordPart;
         break;
   }
}

function showToast(message, type = 'success') {
   toast.textContent = message;
   toast.className = `toast show ${type === 'error' ? 'toast-error' : ''}`;
   setTimeout(() => {
      toast.classList.remove('show');
   }, 3000);
}


function showAiAssistantModal(assemblyDate) {
   // Find the assembly data for the selected date
   currentAssemblyData = assemblies.find(assembly => assembly.date === assemblyDate);

   if (currentAssemblyData) {
      aiAssistantModal.style.display = 'flex';
   } else {
      showToast('Assembly data not found!', 'error');
   }
}

function hideAiAssistantModal() {
   aiAssistantModal.style.display = 'none';
}

function handleAiAssistantOption(optionType) {
   if (!currentAssemblyData) {
      showToast('No assembly selected!', 'error');
      return;
   }

   // This function will pass the assembly data and option type to your AI handler
   requestAiAssistance(currentAssemblyData, optionType);

   // Hide the modal after selection
   hideAiAssistantModal();

}

async function requestAiAssistance(assemblyData, assistanceType) {
   console.log('Assembly Data:', assemblyData);
   console.log('Assistance Type:', assistanceType);

   // Show loading state in the response modal
   showLoadingInResponseModal(assistanceType, assemblyData);

   // Prepare request data
   const requestData = {
      assemblyData: assemblyData,
      assistanceType: assistanceType
   };

   // Making call to AI Service

   const prompt = getPrompt(assistanceType, assemblyData);

   const response = await window.fetchResponse(prompt);

   showAiResponseModal(assistanceType, response, assemblyData);
}

function showAiResponseModal(responseType, responseContent, assemblyData) {
   // Set the title based on the response type
   let title = 'AI Response';
   let subtitle = '';

   switch (responseType) {
      case 'script':
         title = 'Anchoring Script';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'skit':
         title = 'Assembly Skit';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'suggestions':
         title = 'Assembly Enhancement Suggestions';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      default:
         title = 'AI Response';
   }

   // Set the title and content
   aiResponseTitle.innerHTML = title + `<div class="response-subtitle">${subtitle}</div>`;
   aiResponseContent.innerHTML = formatResponse(responseContent);

   // Show the modal
   aiResponseModal.style.display = 'flex';
}

function formatResponse(text) {
   if (!text) return '';

   // Step 1: Escape HTML special characters to prevent XSS
   let formatted = text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'");

   // Step 2: Convert line breaks to <br> tags
   formatted = formatted.replace(/\n/g, '<br>');

   // Step 3: Format paragraphs (double line breaks)
   formatted = formatted.replace(/(<br>){2,}/g, '</p><p>');
   formatted = '<p>' + formatted + '</p>';
   formatted = formatted.replace(/<p><\/p>/g, '<br>'); // Clean up empty paragraphs

   // Step 4: Handle numbered lists
   const numberedListRegex = /<br>(\d+\.)\s(.*?)(?=<br>\d+\.|$)/gs;
   if (formatted.match(numberedListRegex)) {
      formatted = formatted.replace(numberedListRegex, (match, number, content) => {
         return `<br><ol start="${number.replace('.', '')}"><li>${content}</li></ol>`;
      });
   }

   // Step 5: Handle bullet points
   const bulletPointRegex = /<br>(\*|-|\•)\s(.*?)(?=<br>(\*|-|\•)|$)/gs;
   if (formatted.match(bulletPointRegex)) {
      formatted = formatted.replace(bulletPointRegex, '<br><ul><li>$2</li></ul>');
   }

   // Step 6: Format bold text (** or __ markdown style)
   formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
   formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');

   // Step 7: Format italic text (* or _ markdown style)
   formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
   formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');

   // Step 8: Format code blocks (``` markdown style)
   formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

   // Step 9: Format inline code (` markdown style)
   formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');

   // Step 10: Format headings (markdown # style)
   formatted = formatted.replace(/<br>#{6}\s+(.*?)(?=<br>|$)/g, '<br><h6>$1</h6>');
   formatted = formatted.replace(/<br>#{5}\s+(.*?)(?=<br>|$)/g, '<br><h5>$1</h5>');
   formatted = formatted.replace(/<br>#{4}\s+(.*?)(?=<br>|$)/g, '<br><h4>$1</h4>');
   formatted = formatted.replace(/<br>#{3}\s+(.*?)(?=<br>|$)/g, '<br><h3>$1</h3>');
   formatted = formatted.replace(/<br>#{2}\s+(.*?)(?=<br>|$)/g, '<br><h2>$1</h2>');
   formatted = formatted.replace(/<br>#{1}\s+(.*?)(?=<br>|$)/g, '<br><h1>$1</h1>');

   // Step 11: Format links [text](url)
   formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

   // Step 12: Format horizontal rules
   formatted = formatted.replace(/<br>(\-{3,}|\*{3,}|_{3,})(<br>|$)/g, '<hr>');

   // Step 13: Clean up any trailing <br> tags
   formatted = formatted.replace(/<br>$/g, '');

   return formatted;
}

function hideAiResponseModal() {
   aiResponseModal.style.display = 'none';
}

function copyResponseToClipboard() {
   // Get text content
   const content = aiResponseContent.innerText || aiResponseContent.textContent;

   // Create a temporary textarea element to copy from
   const textarea = document.createElement('textarea');
   textarea.value = content;
   document.body.appendChild(textarea);
   textarea.select();

   try {
      // Execute copy command
      document.execCommand('copy');
      showCopyFeedback();
   } catch (err) {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy content!', 'error');
   } finally {
      document.body.removeChild(textarea);
   }
}

function showCopyFeedback() {
   // Create and show feedback element
   const feedback = document.createElement('span');
   feedback.className = 'copy-feedback';
   feedback.innerHTML = '<i class="fas fa-check"></i> Copied!';

   // Add it next to the button
   copyResponseBtn.parentNode.appendChild(feedback);

   // Show feedback
   setTimeout(() => {
      feedback.classList.add('show');
   }, 10);

   // Remove feedback after 2 seconds
   setTimeout(() => {
      feedback.classList.remove('show');
      setTimeout(() => {
         feedback.remove();
      }, 300);
   }, 2000);

   // Also show toast
   showToast('Content copied to clipboard!');
}

// Helper function to format date nicely
function formatDate(dateStr) {
   const date = new Date(dateStr);
   return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
   });
}

function showLoadingInResponseModal(assistanceType, assemblyData) {
   // Set the title based on response type
   let title = 'Loading AI Response';
   let subtitle = '';

   switch (assistanceType) {
      case 'script':
         title = 'Generating Anchoring Script';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'skit':
         title = 'Creating Assembly Skit';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
      case 'suggestions':
         title = 'Thinking of Enhancement Suggestions';
         subtitle = `For ${formatDate(assemblyData.date)} Assembly on "${assemblyData.theme}"`;
         break;
   }

   // Set the title and loading content
   aiResponseTitle.innerHTML = title + `<div class="response-subtitle">${subtitle}</div>`;
   aiResponseContent.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">Generating content with AI. This may take a moment...</div>
        </div>
    `;

   // Show the modal
   aiResponseModal.style.display = 'flex';
}

// Function to get sample responses for demonstration purposes
// Replace this with your actual AI response handling
function getPrompt(assistanceType, assemblyData) {
   switch (assistanceType) {
      case 'script':
         return 'Write a school assembly script based on the following JSON data: \n' + JSON.stringify(assemblyData);

      case 'skit':
         return 'Write a skit based on the following JSON data: \n' + JSON.stringify(assemblyData);

      case 'suggestions':
         return 'Write assembly enhancement suggestions based on the following JSON data: \n' + JSON.stringify(assemblyData);

      default:
         return null;
   }
}

function extractSuggestions(aiText) {
  try {
    // Extract the JSON string using regex
    const match = aiText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) return [];

    const jsonString = match[1];
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed.suggestions)) {
      return parsed.suggestions;
    }
    return [];
  } catch (error) {
    return [];
  }
}

document.getElementById('assemblyDate').addEventListener('change', function () {
   const selectedDate = this.value;
   const foundAssembly = assemblies.find(a => a.date === selectedDate);

   const form = document.getElementById('assemblyForm');
   const conductingClassSelect = document.getElementById('conductingClass');
   const additionalRolesDiv = document.getElementById('additionalRoles');

   if (foundAssembly) {
      document.getElementById('theme').value = foundAssembly.theme || '';
      document.getElementById('anchorStudent').value = foundAssembly.anchoring_by || '';
      document.getElementById('thoughtStudent').value = foundAssembly.thought_by || '';
      document.getElementById('thought').value = foundAssembly.thought || '';
      document.getElementById('wordStudent').value = foundAssembly.word_student || '';
      document.getElementById('word').value = foundAssembly.word_of_the_day || '';
      document.getElementById('newsStudent').value = foundAssembly.news_by || '';

      // Auto-select class if it exists
      const classExists = Array.from(conductingClassSelect.options)
         .some(option => option.value === foundAssembly.conducting_class);
      conductingClassSelect.value = classExists ? foundAssembly.conducting_class : '';

      resetAdditionalRoles();

      if (foundAssembly.additional_roles && foundAssembly.additional_roles.length > 0) {
         additionalRolesDiv.classList.remove('hidden');
         foundAssembly.additional_roles.forEach(roleObj => {
            addRole();
            const lastRoleEntry = additionalRolesDiv.lastElementChild;
            lastRoleEntry.querySelector('.role-name').value = roleObj.role || '';
            lastRoleEntry.querySelector('.role-student').value = roleObj.student || '';
         });
      } else {
         additionalRolesDiv.classList.add('hidden');
      }
   } else {
      // Reset form elements
      document.getElementById('theme').value = '';
      document.getElementById('anchorStudent').value = '';
      document.getElementById('thoughtStudent').value = '';
      document.getElementById('thought').value = '';
      document.getElementById('wordStudent').value = '';
      document.getElementById('word').value = '';
      document.getElementById('newsStudent').value = '';
      conductingClassSelect.value = '';

      resetAdditionalRoles();
      additionalRolesDiv.classList.add('hidden');
   }
});

window.onload = function () {
   init();
};
