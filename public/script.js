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

    // Function to calculate the average rating from all ratings
    function calculateAverageRating(ratings) {
        if (!ratings || ratings.length === 0) return 0; // No ratings, return 0
        const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        return (total / ratings.length).toFixed(1); // Average rounded to 1 decimal place
    }

    // Function to render star ratings
    function renderStars(averageRating) {
        const stars = [];
        const fullStars = Math.floor(averageRating); // Full stars
        const halfStar = averageRating % 1 >= 0.5; // Half star condition
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Empty stars

        for (let i = 0; i < fullStars; i++) {
            stars.push('★'); // Full star
        }
        if (halfStar) stars.push('☆'); // Half star
        for (let i = 0; i < emptyStars; i++) {
            stars.push('☆'); // Empty star
        }

        return stars.join(' ');
    }

    // Function to display each place in the list (with ratings and comments)
    function displayPlace(place) {
        const placeElement = document.createElement('div');
        placeElement.classList.add('place');

        const averageRating = calculateAverageRating(place.ratings);
        const stars = renderStars(averageRating);

        placeElement.innerHTML = `
            <h3>${place.name}</h3>
            <p>${place.description || 'Description not available'}</p>
            <p>Average Rating: ${stars} (${averageRating} / 5)</p>
            
            <div class="comments">
                <h4>Comments</h4>
                <ul>
                    ${place.comments && place.comments.length > 0 
                        ? place.comments.map(comment => `<li>${comment.text} <em>- ${comment.user.username}</em></li>`).join('')
                        : '<li>No comments yet.</li>'}
                </ul>
                <!-- Always show the comment submission form -->
                <h4>Submit a Comment:</h4>
                <form id="comment-form-${place._id}">
                    <textarea name="comment" placeholder="Your comment here..." required></textarea>
                    <button type="submit">Submit Comment</button>
                </form>
            </div>
        `;

        placeList.appendChild(placeElement);

        // Handle comment form submission
        document.getElementById(`comment-form-${place._id}`).addEventListener('submit', async (event) => {
            event.preventDefault();
            const comment = event.target.comment.value;

            try {
                const response = await fetch(`/comment/${place._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: comment })
                });

                if (response.ok) {
                    alert('Comment posted successfully!');
                    // Reload the place details to show the new comment
                    loadPlaceDetails(place._id);
                } else {
                    alert('Error posting comment');
                }
            } catch (error) {
                console.error('Error posting comment:', error);
                alert('Error posting comment');
            }
        });
    }

    // Function to fetch places data from the backend (e.g., restaurants, hotels)
    async function fetchPlacesData() {
        try {
            const response = await fetch(`/places/${category}`);  // Fetch places based on the dynamic category
            const places = await response.json();
    
            placeList.innerHTML = ''; // Clear the loading message
    
            if (places.length === 0) {
                placeList.innerHTML = '<p>No places found.</p>';
            } else {
                places.forEach(place => displayPlace(place)); // Display the places
            }
        } catch (error) {
            console.error('Error fetching places:', error);
            placeList.innerHTML = '<p>Error loading places.</p>';
        }
    }
    

    // Fetch places data (restaurants, hotels, etc.) based on the category
    fetchPlacesData();
}

