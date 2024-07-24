document.addEventListener("DOMContentLoaded", function () {
  lottie.loadAnimation({
    container: document.getElementById("lottie"),
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "lottie animation.json",
  });

  document.getElementById("fileInput").addEventListener("change", handleFile, false);
  fetchCurrentProcessingNumber();
  setInterval(fetchCurrentProcessingNumber, 2000);
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

    console.log("Parsed JSON data from Excel:", jsonData);
    displayPhoneNumbers(jsonData);
  };

  reader.readAsArrayBuffer(file);
}

function displayPhoneNumbers(data) {
  const toProcessDiv = document.getElementById("toProcess");
  const processingDiv = document.getElementById("processing");
  const processedDiv = document.getElementById("processed");

  if (data.length === 0) {
    toProcessDiv.innerHTML = "<p>No data found</p>";
    return;
  }

  const phoneNumbers = data.flatMap(row =>
    Object.values(row).filter(value => {
      if (typeof value === "string") {
        value = value.trim();
      }
      return typeof value === "string" && /\d{10}/.test(value);
    })
  );

  console.log("Extracted phone numbers:", phoneNumbers);

  if (phoneNumbers.length > 0) {
    toProcessDiv.textContent = phoneNumbers[0];
    sendPhoneNumbers(phoneNumbers);
  }
}

async function sendPhoneNumbers(phoneNumbers) {
  const toProcessDiv = document.getElementById("toProcess");
  const processingDiv = document.getElementById("processing");
  const processedDiv = document.getElementById("processed");

  try {
    const response = await axios.post(
      "https://callerapp.onrender.com/send-phone-numbers",
      { phone_numbers: phoneNumbers },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Phone numbers sent response:", response);
    if (response.status === 200) {
      console.log("Phone numbers sent successfully:", phoneNumbers);
    } else {
      alert(`Failed to send phone numbers. Status code: ${response.status}`);
    }
  } catch (error) {
    alert(`Error sending phone numbers: ${error.message}`);
  }

  for (let i = 0; i < phoneNumbers.length; i++) {
    const number = phoneNumbers[i];

    toProcessDiv.textContent = "";
    processingDiv.textContent = number;
    await new Promise(resolve => setTimeout(resolve, 1000));

    processingDiv.textContent = "";
    processedDiv.textContent = number;

    if (i + 1 < phoneNumbers.length) {
      toProcessDiv.textContent = phoneNumbers[i + 1];
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  fetchCurrentProcessingNumber();
}


async function fetchCurrentProcessingNumber() {
  try {
    const response = await axios.get("https://callerapp.onrender.com/current-processing-number");
    console.log("Current processing number response:", response);

    // Log the full response data to check its structure
    console.log("Full response data:", response.data);

    // Check if the response status is 200
    if (response.status === 200) {
      // Verify if the data contains currentProcessingNumber
      if (response.data && response.data.currentProcessingNumber !== undefined) {
        const currentProcessingNumber = response.data.currentProcessingNumber;
        const processingDiv = document.getElementById("processing");
        processingDiv.textContent = currentProcessingNumber ? currentProcessingNumber : "None";
      } else {
        console.error("Unexpected response structure:", response.data);
        alert("Response does not contain the expected 'currentProcessingNumber' field.");
      }
    } else {
      alert(`Failed to fetch current processing number. Status code: ${response.status}`);
    }
  } catch (error) {
    alert(`Error fetching current processing number: ${error.message}`);
    console.error("Error details:", error);
  }
}


