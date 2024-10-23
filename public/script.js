const API_KEY = '4dee9244ca9041a8a882f81b760bc3ac';  // Replace with your actual API key
const placeList = document.getElementById('place-list');

if (placeList) {
    let category;

    // Determine the category based on the page
    if (window.location.pathname.includes('restaurants.html')) {
        category = 'catering.restaurant';
    } else if (window.location.pathname.includes('hotels.html')) {
        category = 'accommodation.hotel';
    } else if (window.location.pathname.includes('entertainment.html')) {
        category = 'entertainment';
    }

    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:-85.3094883,35.0457219,5000&limit=20&apiKey=${API_KEY}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            placeList.innerHTML = ''; // Clear the loading message
            
            if (data.features.length > 0) {
                data.features.forEach(place => {
                    const name = place.properties.name || 'Name not available';
                    const address = place.properties.address_line1 || 'Address not available';
                    const listItem = document.createElement('div');
                    listItem.innerHTML = `<h3>${name}</h3><p>${address}</p>`;
                    placeList.appendChild(listItem);
                });
            } else {
                placeList.innerHTML = '<p>No places found.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching places:', error);
            placeList.innerHTML = '<p>Error loading places. Please try again later.</p>';
        });
}
