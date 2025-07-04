document.getElementById('csvFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    skipEmptyLines: true,
    complete: function (results) {
      const data = results.data;

      // Debug: log parsed data (optional)
      console.log("Parsed CSV data:", data);

      // Find header row with "Folio Name"
      const headerIndex = data.findIndex(row => row.includes("Folio Name"));
      if (headerIndex === -1) {
        alert("Header row with 'Folio Name' not found in CSV");
        return;
      }

      const headers = data[headerIndex];
      const guestRows = data.slice(headerIndex + 1);

      const headerMap = {
        name: headers.indexOf("Folio Name"),
        checkout: headers.indexOf("Departure"),
        room: headers.indexOf("Room")
      };

      // Ensure headers found
      if (headerMap.name === -1 || headerMap.checkout === -1 || headerMap.room === -1) {
        alert("Required columns ('Folio Name', 'Departure', 'Room') not found in CSV");
        return;
      }

      const guests = guestRows
        .filter(row => row.length > headerMap.room)
        .map(row => {
          const fullName = row[headerMap.name] || "";
          const [lastName, firstNameRaw] = fullName.split(",");
          const firstInitial = (firstNameRaw || "").trim().charAt(0).toLowerCase();

          let formattedName = `${(lastName || '').trim()}.${firstInitial}`;
          if (formattedName.includes('#')) {
            formattedName = '';
          }

          return {
            room: (row[headerMap.room] || "").trim(),
            name: formattedName,
            checkout: (row[headerMap.checkout] || "").trim()
          };
        })
        .filter(g => g.room && g.checkout);

      renderGuests(guests);
    },
    error: function(err) {
      console.error("PapaParse error:", err);
      alert("Error parsing CSV file. See console for details.");
    },
    encoding: "ISO-8859-1"
  });
});

function renderGuests(guests) {
  const container = document.getElementById('output');
  container.innerHTML = '';

  guests.forEach(guest => {
    if (
      !guest.room.trim() || !guest.checkout.trim() ||
      guest.room.trim() === '.' || guest.checkout.trim() === '.'
    ) return;

    const tag = document.createElement('div');
    tag.className = 'guest-tag';

    const line = document.createElement('div');

    const roomDiv = document.createElement('div');
    roomDiv.textContent = guest.room;

    const nameDiv = document.createElement('div');
    nameDiv.textContent = guest.name || '';

    const dateDiv = document.createElement('div');
    dateDiv.textContent = guest.checkout;

    line.appendChild(roomDiv);
    line.appendChild(nameDiv);
    line.appendChild(dateDiv);

    tag.appendChild(line);
    container.appendChild(tag);
  });
}
