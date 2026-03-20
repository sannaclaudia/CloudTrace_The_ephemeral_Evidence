# CloudTrace: The Ephemeral Evidence ☁️🔍

**Un Serious Game per la Cloud Forensics**
[cite_start]*Sviluppato per il corso di Computer Forensics and Cyber Crime Analysis[cite: 5].*

## 📖 Descrizione del Progetto
[cite_start]**CloudTrace** è un simulatore investigativo progettato per addestrare i futuri *first responder* ad affrontare le sfide uniche della **Cloud Forensics**[cite: 1965]. [cite_start]A differenza delle indagini tradizionali su dispositivi fisici, gli ambienti cloud presentano ostacoli specifici come la mancanza di accesso hardware [cite: 1989][cite_start], l'elevata volatilità delle risorse [cite: 2010] [cite_start]e la complessità dei dati ridondanti[cite: 2000]. 

In questo scenario, il giocatore deve indagare su un *data breach* causato da una Virtual Machine (VM) canaglia ("Rogue_Instance_01"), facendo triage in tempo reale ed estraendo le prove prima che il sistema di auto-scaling distrugga l'istanza.

## 🎯 Obiettivi Didattici (Learning Outcomes)
Il gioco trasforma la teoria accademica in meccaniche interattive, focalizzandosi su 4 concetti chiave:
1. [cite_start]**Lack of Physical Access:** Nel cloud non è possibile effettuare un *dump* fisico della memoria bit-a-bit[cite: 1989]. [cite_start]Il giocatore impara a dipendere da acquisizioni logiche e API fornite dal Cloud Service Provider (CSP)[cite: 1991, 2026].
2. **Gestione della Volatilità:** Le istanze cloud possono nascere e morire in pochi minuti. [cite_start]Il giocatore deve congelare la scena (es. isolando la rete) e catturare *snapshot* prima che i dati volatili vengano perschi per sempre[cite: 2010].
3. **Il Problema della Ridondanza:** I dati cloud sono replicati per l'alta disponibilità. [cite_start]Il giocatore impara ad analizzare timestamp e *Replication Tags* per isolare la **Primary Copy**[cite: 2000, 2041, 2046], evitando duplicazioni e inconsistenze durante la raccolta delle prove.
4. [cite_start]**Analisi dei Log Logici:** Utilizzo simulato di servizi come AWS CloudTrail [cite: 1994] per tracciare le API calls, attribuire l'attacco a un IP specifico e identificare le credenziali compromesse.

## 🛠️ Stack Tecnologico
Questo artefatto è sviluppato come una Single Page Application (SPA) client-side:
- **Framework:** React.js + Vite
- **Styling:** Tailwind CSS (per l'interfaccia "Dark Mode" in stile terminale cloud)
- **Logica Dati:** Stati React e file JSON locali (nessun backend richiesto, massima portabilità).

## 🚀 Come avviare il progetto in locale
1. Clona questa repository: `git clone <url-repo>`
2. Entra nella cartella del gioco: `cd Game`
3. Installa le dipendenze: `npm install`
4. Avvia il server di sviluppo: `npm run dev`
5. Apri il browser all'indirizzo `http://localhost:5173`