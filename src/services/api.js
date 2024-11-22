import axios from 'axios';

/**
 * Sendet Daten an den konfigurierten Webhook.
 * @param {string} webhookURL - Die URL des Webhooks.
 * @param {Object} data - Die zu sendenden Daten (message, audio, etc.).
 * @returns {Promise} - Axios Promise mit der Serverantwort.
 */
export const sendToWebhook = async (webhookURL, data) => {
  // Check, whether the webhook URL has been set.
  if (!webhookURL) {
    throw new Error("Webhook URL is not set.");
  }

  const formData = new FormData();
  // Adds text message and other data to formData
  formData.append('text', data.text);
  if (data.audio) {
    // Adding audio data to formData if provided
    formData.append('audio', data.audio, 'audio.mp3');
  }
  formData.append('timestamp', data.timestamp);
  formData.append('os', data.os);
  formData.append('browser', data.browser); // Neu hinzugefügt

  // Newly added properties
  formData.append('audioAttached', data.audioAttached);
  formData.append('imageAttached', data.imageAttached);

  try {
    // Sends data to the webhook with a specified timeout
    const response = await axios.post(webhookURL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 5000 // Timeout nach 5 Sekunden
    });
    return response;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error("Request timed out. Please try again.");
    }

    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to send message.');
    } else if (error.request) {
      throw new Error("No response from server. Please try again later.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
};