// Survey State
let currentQuestion = 1;
const totalQuestions = 5;
const formData = {};

// DOM Elements
const form = document.getElementById('surveyForm');
const questions = document.querySelectorAll('.question');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressBar = document.getElementById('progressBar');
const currentStepSpan = document.getElementById('currentStep');
const totalStepsSpan = document.getElementById('totalSteps');
const thankYouDiv = document.getElementById('thankYou');
const surveyContainer = document.querySelector('.survey-container');

// Initialize
totalStepsSpan.textContent = totalQuestions;
updateProgress();

// Event Listeners
nextBtn.addEventListener('click', nextQuestion);
prevBtn.addEventListener('click', prevQuestion);
form.addEventListener('submit', handleSubmit);

// Add click handlers for radio buttons to auto-advance
document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Only auto-advance for questions 1-3 (multiple choice)
        const questionNum = parseInt(e.target.closest('.question').dataset.question);
        if (questionNum <= 3) {
            setTimeout(() => {
                nextQuestion();
            }, 300);
        }
    });
});

// Postcode validation - convert to uppercase and validate format
const postcodeInput = document.getElementById('postcode');
if (postcodeInput) {
    postcodeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
    
    postcodeInput.addEventListener('blur', (e) => {
        const postcode = e.target.value.trim();
        const postcodeRegex = /^([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})$/;
        
        if (postcode && !postcodeRegex.test(postcode)) {
            e.target.setCustomValidity('Please enter a valid UK postcode (e.g., SW1A 1AA)');
            e.target.reportValidity();
        } else {
            e.target.setCustomValidity('');
        }
    });
}

function nextQuestion() {
    if (!validateCurrentQuestion()) {
        return;
    }
    
    saveCurrentQuestionData();
    
    if (currentQuestion < totalQuestions) {
        currentQuestion++;
        showQuestion(currentQuestion);
        updateProgress();
        updateButtons();
    }
}

function prevQuestion() {
    if (currentQuestion > 1) {
        currentQuestion--;
        showQuestion(currentQuestion);
        updateProgress();
        updateButtons();
    }
}

function showQuestion(questionNumber) {
    questions.forEach(question => {
        question.classList.remove('active');
    });
    
    const activeQuestion = document.querySelector(`[data-question="${questionNumber}"]`);
    if (activeQuestion) {
        activeQuestion.classList.add('active');
        // Scroll to top of survey container
        surveyContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateProgress() {
    const progress = (currentQuestion / totalQuestions) * 100;
    progressBar.style.width = progress + '%';
    currentStepSpan.textContent = currentQuestion;
}

function updateButtons() {
    // Show/hide previous button
    if (currentQuestion === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }
    
    // Show/hide next and submit buttons
    if (currentQuestion === totalQuestions) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function validateCurrentQuestion() {
    const activeQuestion = document.querySelector(`[data-question="${currentQuestion}"]`);
    
    if (currentQuestion <= 3) {
        // Radio button questions
        const radioInputs = activeQuestion.querySelectorAll('input[type="radio"]');
        const isChecked = Array.from(radioInputs).some(radio => radio.checked);
        
        if (!isChecked) {
            alert('Please select an option before continuing.');
            return false;
        }
    } else {
        // Form field questions
        const inputs = activeQuestion.querySelectorAll('input, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    return true;
}

function saveCurrentQuestionData() {
    const activeQuestion = document.querySelector(`[data-question="${currentQuestion}"]`);
    
    if (currentQuestion <= 3) {
        // Radio button questions
        const radioInputs = activeQuestion.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(radio => {
            if (radio.checked) {
                formData[radio.name] = radio.value;
            }
        });
    } else {
        // Form field questions
        const inputs = activeQuestion.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            formData[input.name] = input.value;
        });
    }
}

function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentQuestion()) {
        return;
    }
    
    saveCurrentQuestionData();
    
    // Add timestamp
    formData.timestamp = new Date().toLocaleString('en-GB');
    
    // Submit to Google Sheets
    submitToGoogleSheets(formData);
}

// Initialize buttons state
updateButtons();

// Google Sheets Integration
// INSTRUCTIONS TO SET UP:
// 1. Go to https://script.google.com/
// 2. Create a new project
// 3. Copy the code from the comments below into the script editor
// 4. Deploy as a web app and copy the URL
// 5. Replace 'YOUR_GOOGLE_SCRIPT_URL_HERE' below with your deployment URL

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysf4IpTNHmZRQAqb6fXpt6ox3JZqzE4wYLJqJx2E6BZ9B2KPerJKyPT9eKdlLqhOGJ/exec';

async function submitToGoogleSheets(data) {
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        // Show success message
        form.style.display = 'none';
        document.querySelector('.survey-header').style.display = 'none';
        thankYouDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Error submitting to Google Sheets:', error);
        alert('There was an error submitting your information. Please try again or contact us directly at info@abacusenergysolutions.co.uk');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
}

/*
GOOGLE APPS SCRIPT CODE:
Copy everything between the START and END markers below and paste into Google Apps Script

============ START GOOGLE APPS SCRIPT ============

// Force authorization by declaring required scopes
function forceAuthorization() {
  // This function requests all necessary permissions
  SpreadsheetApp.getActiveSpreadsheet();
  MailApp.getRemainingDailyQuota();
}

function doPost(e) {
  try {
    // Get the active spreadsheet (make sure you've created one and it's open)
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse the incoming data
    var data = JSON.parse(e.postData.contents);
    
    // If this is the first entry, create headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Fuel Type',
        'Bedrooms',
        'Property Type',
        'Post Code',
        'Address',
        'Name',
        'Telephone',
        'Email'
      ]);
    }
    
    // Add the data as a new row
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.fuelType || '',
      data.bedrooms || '',
      data.propertyType || '',
      data.postcode || '',
      data.address || '',
      data.name || '',
      data.telephone || '',
      data.email || ''
    ]);
    
    // Send automated email to customer
    if (data.email) {
      sendCustomerEmail(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error',
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendCustomerEmail(data) {
  // Log for debugging
  Logger.log('Attempting to send email to: ' + data.email);
  
  var customerEmail = data.email;
  var customerName = data.name || 'Valued Customer';
  
  // Validate email exists
  if (!customerEmail || customerEmail.trim() === '') {
    Logger.log('No email address provided');
    return;
  }
  
  var subject = 'Your Heat Pump Enquiry - Abacus Energy Solutions';
  
  var htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background-color: #1a1a1a;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      letter-spacing: 2px;
      font-weight: 700;
    }
    .banner {
      background: linear-gradient(135deg, #00a651 0%, #008a43 100%);
      color: #ffffff;
      padding: 25px 20px;
      text-align: center;
    }
    .banner h2 {
      margin: 0 0 10px 0;
      font-size: 22px;
      font-weight: 700;
    }
    .banner p {
      margin: 0;
      font-size: 16px;
    }
    .content {
      padding: 35px 30px;
    }
    .content p {
      font-size: 16px;
      color: #333333;
      margin-bottom: 20px;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background-color: #00a651;
      color: #ffffff;
      padding: 14px 35px;
      text-decoration: none;
      border-radius: 5px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .footer {
      background-color: #1a1a1a;
      color: #cccccc;
      padding: 30px 20px;
      text-align: center;
      font-size: 13px;
      line-height: 1.8;
    }
    .footer a {
      color: #00a651;
      text-decoration: none;
    }
    .footer-phone {
      font-size: 18px;
      color: #ffffff;
      font-weight: 600;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>ABACUS ENERGY SOLUTIONS</h1>
    </div>
    
    <div class="banner">
      <h2>£500 OFF</h2>
      <p>Order before December 19th</p>
    </div>
    
    <div class="content">
      <p>Hi ${customerName},</p>
      
      <p>Thanks for your heat pump enquiry. We'll be in touch within 24 hours to discuss your requirements.</p>
      
      <p><strong>Your details:</strong><br>
      ${data.propertyType || 'Property'} • ${data.bedrooms || 'Bedrooms'} • ${data.fuelType || 'Fuel type'}</p>
      
      <p>With 30+ years experience and thousands of satisfied customers, we'll find the perfect energy solution for your home.</p>
      
      <p style="margin-bottom: 10px;">Best regards,<br>
      <strong>Abacus Energy Solutions</strong></p>
    </div>
    
    <div class="footer">
      <div class="footer-phone">03301 244 299</div>
      <a href="mailto:info@abacusenergysolutions.co.uk">info@abacusenergysolutions.co.uk</a><br>
      <a href="https://abacusenergysolutions.co.uk">abacusenergysolutions.co.uk</a>
      
      <p style="margin-top: 20px;">Unit 7 Olympic Way, Sefton Business Park, L30 1RD</p>
      
      <p style="font-size: 11px; color: #999999; margin-top: 20px;">
        © 2024 Abacus Energy Solutions. All Rights Reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  var plainBody = `
Hi ${customerName},

Thanks for your heat pump enquiry. We'll be in touch within 24 hours to discuss your requirements.

LIMITED OFFER: £500 OFF when you order before December 19th

Your details:
${data.propertyType || 'Property'} • ${data.bedrooms || 'Bedrooms'} • ${data.fuelType || 'Fuel type'}

With 30+ years experience and thousands of satisfied customers, we'll find the perfect energy solution for your home.

Best regards,
Abacus Energy Solutions

---
Call: 03301 244 299
Email: info@abacusenergysolutions.co.uk
Web: abacusenergysolutions.co.uk

Unit 7 Olympic Way, Sefton Business Park, L30 1RD
  `;
  
  try {
    MailApp.sendEmail({
      to: customerEmail,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody,
      name: 'Abacus Energy Solutions'
    });
    Logger.log('Email sent successfully to: ' + customerEmail);
  } catch (error) {
    Logger.log('Error sending email: ' + error.toString());
    // Re-throw error to see it in execution logs
    throw new Error('Email sending failed: ' + error.toString());
  }
}

// Test function - run this manually to trigger authorization
function testEmailFunction() {
  var testData = {
    email: 'test@example.com',
    name: 'Test User',
    fuelType: 'Natural Gas',
    bedrooms: 'Three bedrooms',
    propertyType: 'Detached / Semi / Terraced',
    postcode: 'L30 1RD'
  };
  
  Logger.log('Testing email function...');
  sendCustomerEmail(testData);
  Logger.log('Test complete - check your inbox');
}

function doGet(e) {
  return doPost(e);
}

============ END GOOGLE APPS SCRIPT ============

SETUP INSTRUCTIONS:
1. Create a new Google Sheet for your survey responses
2. Go to Extensions > Apps Script
3. Delete any existing code and paste the code above
4. Click "Deploy" > "New deployment"
5. Choose "Web app" as the deployment type
6. Set "Execute as" to "Me"
7. Set "Who has access" to "Anyone"
8. Click "Deploy"
9. Copy the Web App URL
10. Paste it in the GOOGLE_SCRIPT_URL variable above (replace 'YOUR_GOOGLE_SCRIPT_URL_HERE')
11. Authorize the script when prompted
*/
