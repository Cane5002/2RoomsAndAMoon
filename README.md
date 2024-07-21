For setting up EC2 refer to https://jonathans199.medium.com/how-to-deploy-node-express-api-to-ec2-instance-in-aws-bc038a401156
# How to run:
0. Verify you have express and node installed
1. cd 2RoomsAndAMoon
2. npm install
3. set desired port in ./bin/www.js
4. npm start
4.5 pm2 start .bin/www.js (if you want to run even when cli is not open
