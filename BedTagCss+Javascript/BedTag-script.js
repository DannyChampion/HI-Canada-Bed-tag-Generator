/**
 * Guest Bed Tag Generator
 * -----------------------
 * This script processes a CSV file containing guest information (Name, Room, Departure),
 * and dynamically generates A6-sized guest bed tags styled in the theme of HI Hostels Canada.
 * 
 * Group Booking Logic:
 * If the number at the start of Room Type matches the count of Voucher ID appearances,
 * only one bed tag is printed for that group.
 * 
 * Written by: Danny James Champion
 * Date: 06/30/2025
 */

document.getElementById('csvFile').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    skipEmptyLines: true,
    encoding: "ISO-8859-1",

    complete: function (results) {
      const data = results.data;

      console.log("Raw CSV data rows:", data.length);

      const headerIndex = data.findIndex(row => row.includes("Folio Name"));
      if (headerIndex === -1) {
        alert("Header row with 'Folio Name' not found in CSV.");
        return;
      }

      const headers = data[headerIndex];
      const guestRows = data.slice(headerIndex + 1);

      const headerMap = {
        name: headers.indexOf("Folio Name"),
        checkout: headers.indexOf("Departure"),
        room: headers.indexOf("Room"),
        roomType: headers.indexOf("Room Type"),
        voucher: headers.indexOf("Voucher"),
        guests: headers.indexOf("Ad.")
      };

      if (
        headerMap.name === -1 || headerMap.checkout === -1 ||
        headerMap.room === -1 || headerMap.roomType === -1 || headerMap.voucher === -1
      ) {
        alert("Required columns missing: Folio Name, Departure, Room, Room Type, Voucher");
        return;
      }

      const rawGuests = guestRows
        .filter(row => row.length > Math.max(headerMap.voucher, headerMap.roomType))
        .map(row => {
          const fullName = row[headerMap.name] || "";
          const [lastName, firstNameRaw] = fullName.split(",");
          const firstInitial = (firstNameRaw || "").trim().charAt(0).toLowerCase();

          let formattedName = `${(lastName || '').trim()}.${firstInitial}`;
          if (formattedName.includes('#')) formattedName = '';

          return {
            name: formattedName,
            room: (row[headerMap.room] || "").trim(),
            checkout: (row[headerMap.checkout] || "").trim(),
            roomType: (row[headerMap.roomType] || "").trim(),
            voucher: (row[headerMap.voucher] || "").trim(),
            guests: parseInt(row[headerMap.guests]) || 1  // default to 1 if missing
          };
        })
        .filter(g => g.room && g.checkout); // filter invalid entries

      console.log("Total guests parsed:", rawGuests.length);

      // Step 1: Group by voucher
      const voucherMap = {};
      rawGuests.forEach(guest => {
        const key = guest.voucher || `__NOVOUCHER__-${guest.room}-${guest.checkout}`;
        if (!voucherMap[key]) voucherMap[key] = [];
        voucherMap[key].push(guest);
      });

      // Step 2: Conditionally reduce group to one tag if bed count matches
      const finalGuests = [];

      Object.entries(voucherMap).forEach(([voucher, group]) => {
        const firstGuest = group[0];
        const match = firstGuest.roomType.match(/^(\d+)-Bed/i);
        const bedCount = match ? parseInt(match[1], 10) : null;

        if (
          bedCount &&
          group.length === bedCount &&
          !voucher.startsWith("__NOVOUCHER__") &&
          voucher.trim() !== ""
        ) {
          // Valid group booking: only one tag
          console.log(`Group booking detected: Voucher ${voucher}, Bed Count: ${bedCount}`);
          finalGuests.push({
            ...firstGuest,
            name: firstGuest.name + " + "
          });
        } else {
          // Either not a group or voucher missing/invalid
          console.log(`Individual guests for voucher: ${voucher} (count: ${group.length})`);
          finalGuests.push(...group);
        }
      });

      console.log("Final tags to render:", finalGuests.length);
      renderGuests(finalGuests);
    },

    error: function (err) {
      console.error("PapaParse error:", err);
      alert("Error parsing CSV file. See console for details.");
    }
  });
});

/**
 * Render guest tags into the page container.
 * Each tag displays the room number, formatted name, and checkout date.
 */
function renderGuests(guests) {
  const container = document.getElementById('output');
  container.innerHTML = '';

  const guestCountDisplay = document.getElementById('guestCount');
  guestCountDisplay.textContent = `Total Tags: ${guests.length}`;
  guestCountDisplay.classList.remove('hidden');


  guests.forEach(guest => {
    if (
      !guest.room.trim() || !guest.checkout.trim() ||
      guest.room.trim() === '.' || guest.checkout.trim() === '.'
    ) return;

    const tag = document.createElement('div');
    tag.className = 'guest-tag';

    const line = document.createElement('div');

    const roomDiv = document.createElement('div');

    // Format: "101-1" becomes "101¹"
    const roomParts = guest.room.split('-');
    if (roomParts.length === 2) {
      const [main, sub] = roomParts;

      roomDiv.innerHTML = `${main}<sup style="font-size: 0.6em;">${sub}</sup>`;
    } else {
      roomDiv.textContent = guest.room; // fallback
    }


    const nameDiv = document.createElement('div');

if (guest.guests > 1 && guest.name) {
  nameDiv.innerHTML = `${guest.name}<sup style="font-size: 0.6em;">${guest.guests}</sup>`;
} else {
  nameDiv.textContent = guest.name || '';
}

    const dateDiv = document.createElement('div');
    dateDiv.textContent = guest.checkout;

    line.appendChild(roomDiv);
    line.appendChild(nameDiv);
    line.appendChild(dateDiv);
    tag.appendChild(line);

    container.appendChild(tag);
  });
  document.getElementById('printBtn').addEventListener('click', function () {
  window.print();
});
}
