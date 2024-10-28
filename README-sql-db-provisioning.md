# [README-sql-db-provisioning.md](README-sql-db-provisioning.md)

Prereqs
- install SMSS
  - https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16
- install SQL Server 2022 Express
  - https://www.microsoft.com/en-us/sql-server/sql-server-downloads

After SQL Server Express install, should offer to create a local db. 
Connect to it with SMSS with File > Connect, with Server properties:
- server name: localhost\SQLEXPRESS
- Auth: Windows
- Trust server certificate checked

# setup server for connection from node lib mssql

Setup server network options

- launch SQL Server Configuration Manager
  - `mmc.exe /32 "C:\Windows\System32\SQLServerManager16.msc"
- under server services, set sql server browser start mode to automatic, then enable service
- Expand SQL Server Network Configuration > Protocols for SQLEXPRESS.
  - Right-click on TCP/IP and select Enable. 
  - Restart the SQL Server Express service.

Allow "sa" user login

- connect to server in SQL Server Management Studio (SSMS)
- Expand Security  > Logins and Go to user "sa" properties
  - under General, set password 
  - under status, set Login: enabled

Setup config in [db.js](db.js)

