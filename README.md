# DB_Webtechniken
Mitgliederverwaltung des StuRa der TU Chemnitz
##Installation unter Ubuntu
1. Als Erstes bitte das Zipfile herunterladen und entpacken <pre>unzip DB_Webtechniken-master.zip</pre>
2. Dann in den Ordner wechseln <pre>cd DB_Webtechniken-master</pre>
3. Alle nötigen Pakete Installieren: <pre>sudo apt-get install nodejs mongodb npm</pre>
4. Jetzt die NPM Pakete installieren: <pre>npm install</pre>
5. (Optional) Den Datenbankpfad anpassen in der db.js Datei (falls nötig)
5. Jetzt kann man die Anwendung starten mit: <pre>nodejs ./bin/www</pre>
6. Die Webanwendung läuft jetzt auf [http://localhost:3000](http://localhost:3000)
