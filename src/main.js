/* Haupt-Einstiegspunkt der Vue-Anwendung */

import { createApp } from 'vue';
import App from './App.vue';

/* Globale CSS-Dateien für Bootstrap und benutzerdefinierte Stile */
import './styles.css'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

/* Registrierung des Service Workers */
import './registerServiceWorker'

/* Erstellen und Mounten der Vue-App */
createApp(App).mount('#app');