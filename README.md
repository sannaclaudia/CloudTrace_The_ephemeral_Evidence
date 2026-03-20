# CloudTrace: The Ephemeral Evidence ☁️🔍

**Un Serious Game avanzato per la Cloud Forensics**
*Sviluppato per gli studenti magistrali del corso di Computer Forensics and Cyber Crime Analysis.*

## 📖 Descrizione del Progetto

**CloudTrace** è un simulatore investigativo di livello esperto progettato per addestrare i futuri *first responder* e analisti forensi ad affrontare le sfide uniche della **Cloud Forensics**. A differenza delle indagini tradizionali su dispositivi fisici, gli ambienti cloud presentano ostacoli specifici: la totale mancanza di accesso hardware, l'estrema volatilità delle risorse gestite dall'auto-scaling e la complessità dell'acquisizione di dati distribuiti e ridondanti.

In questo scenario *time-critical*, il giocatore veste i panni di un Incident Responder cloud. Una Virtual Machine (VM) canaglia ("Rogue_Instance_01") ha compromesso la rete e sta esfiltrando dati aziendali sensibili. Il giocatore deve contenere la minaccia, acquisire le prove volatili prima che l'istanza venga terminata dall'orchestrazione cloud, e infine analizzare i log per effettuare l'attribuzione dell'attacco.

## 🎯 Fasi dell'Indagine & Obiettivi Didattici (Learning Outcomes)

Il gioco trasforma la teoria accademica avanzata in meccaniche interattive punitive. Ogni errore procedurale riduce l'**Admissibility Score** (Punteggio di Ammissibilità) delle prove, culminando in un Grade finale (da A ad F) accompagnato da un debriefing tecnico basato su standard reali (NIST, ISO/IEC, CISA).

### Fase 1: Triage & Volatility (La Corsa Contro il Tempo)
- **La Sfida:** Il giocatore ha solo **90 secondi** prima che l'auto-scaling distrugga la VM. Viene presentata una console con 6 possibili azioni di risposta.
- **Trappole Forensi:** Pulsanti come "Power Off (ACPI)" o "Suspend VM" sembrano soluzioni logiche IT, ma in ambito forense causano la distruzione irreparabile della memoria RAM (distruggendo connessioni di rete attive e malware fileless). Anche l'uso di "EBS Snapshot" cattura solo lo storage a blocchi, ignorando la memoria volatile.
- **Procedura Corretta:** Il giocatore deve **Isolare la Rete** modificando i Security Group (bloccando l'esfiltrazione in corso senza toccare la memoria), per poi **Verificare lo Stato** dell'istanza e infine acquisire un **API Memory Snapshot**.

### Fase 2: Acquisition & Redundancy (Il Problema della Replica)
- **La Sfida:** I dati sono stati duplicati su 3 bucket S3 in regioni diverse. Il giocatore deve identificare la **Primary Copy** originale per garantirne l'ammissibilità legale.
- **Trappole Forensi:** Calcolare l'hash crittografico (es. MD5) produrrà lo stesso risultato su tutti i bucket: un match di hash prova l'integrità, *non* l'origine.
- **Procedura Corretta:** Il giocatore deve ispezionare i metadati raw AWS e gli oggetti interni, scartando le repliche (identificabili da `ReplicationTimestamp` o da corruzioni derivate da scritture asincrone) e trovando la fonte originale basandosi sul timestamp `LastModified` più vecchio, sul conteggio degli oggetti e sull'abilitazione del Versioning.

### Fase 3: Log Analysis & Attribution (Role Chaining)
- **La Sfida:** Fornire l'attribuzione finale dell'attacco navigando tra 12 eventi in puro formato JSON di AWS CloudTrail.
- **Trappole Forensi:** Gli attaccanti avanzati non usano le credenziali rubate (AKIA...) per compiere azioni dirette. Usano un processo di *Role Chaining*. L'evento malevolo `RunInstances` mostrerà un IP interno di AWS (`ec2.amazonaws.com`) e un token di sessione temporaneo (`ASIA...`).
- **Procedura Corretta:** Il giocatore deve tracciare all'indietro il campo `sessionContext` attraverso multipli eventi `AssumeRole` (es. `AutomationServiceRole` -> `DBSyncServiceRole`) fino a rivelare il **True Attacker Source IP** e l'originale **Root Compromised IAM Key ID** (la chiave permanente compromessa).

## 🛠️ Stack Tecnologico

Questo artefatto è sviluppato come una Single Page Application (SPA) client-side:
- **Framework:** React.js + Vite
- **Styling:** Tailwind CSS (per l'interfaccia "Dark Mode" in stile terminale cloud)
- **Logica Dati:** Stati React puri e file JSON locali (nessun backend richiesto, massima robustezza e portabilità).

## 🚀 Come avviare il progetto in locale

Essendo un'applicazione Node/Vite, l'avvio è immediato:

1. Assicurati di avere [Node.js](https://nodejs.org/) installato.
2. Clona questa repository ed entra nella cartella principale.
3. Installa le dipendenze:
   ```bash
   npm install
   ```
4. Avvia il server di sviluppo locale:
   ```bash
   npm run dev
   ```
5. Apri il browser all'indirizzo `http://localhost:5173` e inizia l'indagine.