For setting up EC2 refer to https://jonathans199.medium.com/how-to-deploy-node-express-api-to-ec2-instance-in-aws-bc038a401156
# How to run:
0. Verify you have express and node installed
1. git clone -b v1.0 https://github.com/Cane5002/2RoomsAndAMoon.git
2. cd 2RoomsAndAMoon
3. npm install
4. set desired port in ./bin/www.js
5. npm start <br>
5.5 pm2 start ./bin/www.js (if you want to run even when cli is not open
