// Function to preload images
  function preloadImages(urls) {
    return Promise.all(urls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
      });
    }));
  }

  // Function to fetch a random image from Lorem Picsum
  async function getRandomImage() {
    try {
      const response = await fetch('https://picsum.photos/1920/1080'); // You can adjust the dimensions as needed
      const imageUrl = response.url;

      // Preload the image
      await preloadImages([imageUrl]);

      // Set the new background image and apply the blur class
      document.body.style.background = `url('${imageUrl}') center/cover no-repeat fixed`;
      document.body.classList.add('blur');

      // Wait for a short duration for the blur effect to take place
      await new Promise(resolve => setTimeout(resolve, 500));

      // Remove the blur class
      document.body.classList.remove('blur');
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  }

  // Set initial background on page load
  getRandomImage();

  // Optionally, you can change the background periodically
  setInterval(getRandomImage, 5000); // Change every 5 seconds (adjust as needed)