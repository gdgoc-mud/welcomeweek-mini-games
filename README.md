# Welcome Week Mini-Games 
## By GDGoC Murdoch University Dubai

A local network 2-player kiosk web app for the welcome week booth. Features Trivia and Debug game modes with real-time sync.

## Setup

Install dependencies:
```sh
npm install
```

Start development server:
```sh
npm run dev
```

## Production

Build the application:
```sh
npm run build
```

Run the application on the local network (replace `<IP>` with your machine's local network IP address):
```sh
PUBLIC_HOST_IP=<IP> HOST=0.0.0.0 PORT=3000 node build
```
