  ____ ____   ____  ___   ____ 
 / ___|  _ \ / ___|/ _ \ / ___|
| |  _| | | | |  _| | | | |    
| |_| | |_| | |_| | |_| | |___ 
 \____|____/ \____|\___/ \____|

 __  __ ___ _   _ ___ 
|  \/  |_ _| \ | |_ _|
| |\/| || ||  \| || | 
| |  | || || |\  || | 
|_|  |_|___|_| \_|___|
                      
  ____    _    __  __ _____ ____  
 / ___|  / \  |  \/  | ____/ ___| 
| |  _  / _ \ | |\/| |  _| \___ \ 
| |_| |/ ___ \| |  | | |___ ___) |
 \____/_/   \_\_|  |_|_____|____/ 

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