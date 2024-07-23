document.addEventListener("DOMContentLoaded", function () {
  lottie.loadAnimation({
    container: document.getElementById("lottie"),
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "lottie animation.json",
  });

  
  document
    .getElementById("fileInput")
    .addEventListener("change", handleFile, false);
  fetchPhoneNumbers();
});

function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(jsonData);
    displayPhoneNumbers(jsonData);
  };

  reader.readAsArrayBuffer(file);
}

function displayPhoneNumbers(data) {
  const toProcessDiv = document.getElementById("toProcess");
  toProcessDiv.innerHTML = "";
  const processingDiv = document.getElementById("processing");
  processingDiv.innerHTML = "";
  const processedDiv = document.getElementById("processed");
  processedDiv.innerHTML = "";

  if (data.length === 0) {
    toProcessDiv.innerHTML = "<p>No data found</p>";
    return;
  }

  const phoneNumbers = [];

  data.forEach((row) => {
    console.log("Processing row:", row);
    Object.keys(row).forEach((key) => {
      let value = row[key];
      if (typeof value === "number") {
        value = value.toString();
      }
      if (typeof value === "string" && /\d{10}/.test(value)) {
        phoneNumbers.push(value);
      }
    });
  });

  console.log("Extracted phone numbers:", phoneNumbers);

  if (phoneNumbers.length > 0) {
    toProcessDiv.textContent = phoneNumbers[0]; // Show the first number to be processed
    sendPhoneNumbers(phoneNumbers);
  }
}

async function sendPhoneNumbers(phoneNumbers) {
  const toProcessDiv = document.getElementById("toProcess");
  const processingDiv = document.getElementById("processing");
  const processedDiv = document.getElementById("processed");

  // Send the entire array of phone numbers only once
  try {
    const response = await axios.post(
      "https://callerapp.onrender.com/send-phone-numbers",
      { phone_numbers: phoneNumbers },
      { headers: { "Content-Type": "application/json" } }
    );

    if (response.status === 200) {
      console.log("Phone numbers sent:", phoneNumbers);
    } else {
      console.error(
        "Failed to send phone numbers. Status code:",
        response.status
      );
      alert(`Failed to send phone numbers. Status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Error sending phone numbers:", error);
    alert(`Error sending phone numbers: ${error.message}`);
  }

  for (let i = 0; i < phoneNumbers.length; i++) {
    const number = phoneNumbers[i];

    // Move the number from toProcess to processing
    toProcessDiv.textContent = ""; // Clear the toProcess section
    processingDiv.textContent = number; // Show the current processing number
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Add delay for demo purposes

    // Move the number from processing to processed
    processingDiv.textContent = ""; // Clear the processing section
    processedDiv.textContent = number; // Show the recently processed number

    // Update the display sections for the next number
    if (i + 1 < phoneNumbers.length) {
      toProcessDiv.textContent = phoneNumbers[i + 1]; // Show the next number to be processed
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // Add delay for demo purposes
  }

  fetchPhoneNumbers(); 
}

async function fetchPhoneNumbers() {
  try {
    const response = await axios.get(
      "https://callerapp.onrender.com/send-phone-numbers"
    );

    if (response.status === 200) {
      const fetchedNumbers = response.data.phone_numbers;
      if (Array.isArray(fetchedNumbers) && fetchedNumbers.length > 0) {
        displayPhoneNumbers(fetchedNumbers);
      } else {
        console.log("No phone numbers fetched");
        alert("No phone numbers fetched");
      }
    } else {
      console.error(
        "Failed to fetch phone numbers. Status code:",
        response.status
      );
      alert(`Failed to fetch phone numbers. Status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    alert(`Error fetching phone numbers: ${error.message}`);
  }
}
