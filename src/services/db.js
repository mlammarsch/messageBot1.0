// services/db.js
export const loadWebhookURL = async () => {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open("WebhooksDB", 1);
  
      dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("webhookStore")) {
          db.createObjectStore("webhookStore", { keyPath: "id" });
        }
      };
  
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(["webhookStore"], "readonly");
        const store = transaction.objectStore("webhookStore");
        const request = store.get("webhook");
  
        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result.url);
          } else {
            resolve(null);
          }
        };
  
        request.onerror = () => {
          reject("Failed to load webhook URL.");
        };
      };
  
      dbRequest.onerror = () => {
        reject("Database connection error.");
      };
    });
  };
  
  export const saveWebhookURL = async (url) => {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open("WebhooksDB", 1);
  
      dbRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("webhookStore")) {
          db.createObjectStore("webhookStore", { keyPath: "id" });
        }
      };
  
      dbRequest.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(["webhookStore"], "readwrite");
        const store = transaction.objectStore("webhookStore");
        const request = store.put({ id: "webhook", url: url });
  
        request.onsuccess = () => {
          resolve();
        };
  
        request.onerror = () => {
          reject("Failed to save webhook URL.");
        };
      };
  
      dbRequest.onerror = () => {
        reject("Database connection error.");
      };
    });
  };