/**
 * storage.js
 * 
 * Diese Datei enthält Funktionen zur Speicherung und zum Laden von Daten im Local Storage.
 * Sie ermöglicht das Speichern der Webhook-URL sowie des Chatverlaufs.
 */

/* Definieren von Konstanten für die Schlüsselnamen zur Vermeidung von Hardcoding */
const WEBHOOK_URL_KEY = 'webhookURL';
const CHAT_MESSAGES_KEY = 'chatMessages';

/**
 * Speichert die Webhook-URL im Local Storage.
 * @param {string} url - Die Webhook-URL, die gespeichert werden soll.
 */
export const saveWebhookURL = (url) => {
  try {
    localStorage.setItem(WEBHOOK_URL_KEY, url);
  } catch (error) {
    console.error('Failed to save Webhook URL:', error);
  }
};

/**
 * Lädt die Webhook-URL aus dem Local Storage.
 * @returns {string} - Die gespeicherte Webhook-URL oder ein leerer String, wenn keine vorhanden ist.
 */
export const loadWebhookURL = () => {
  try {
    return localStorage.getItem(WEBHOOK_URL_KEY) || '';
  } catch (error) {
    console.error('Failed to load Webhook URL:', error);
    return '';
  }
};

/**
 * Speichert die Chatnachrichten im Local Storage.
 * @param {Array} messages - Das Array der Chatnachrichten, das gespeichert werden soll.
 */
export const saveMessages = (messages) => {
  try {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save chat messages:', error);
  }
};

/**
 * Lädt die Chatnachrichten aus dem Local Storage.
 * @returns {Array} - Das Array der gespeicherten Chatnachrichten oder ein leeres Array, wenn keine vorhanden sind.
 */
export const loadMessages = () => {
  try {
    const messages = localStorage.getItem(CHAT_MESSAGES_KEY);
    const parsedMessages = messages ? JSON.parse(messages) : [];
    return Array.isArray(parsedMessages) ? parsedMessages : [];
  } catch (error) {
    console.error('Failed to load chat messages:', error);
    return [];
  }
};