# Setup Instructions

Follow these instructions to set up the Raspberry Pi to act as a controller. Note: this article assumes you are comfortable with Linux and BASH

## 1. Install Node.js

First, you'll need to set up a headless Raspberry Pi with Node.js installed. I wrote some in-depth instructions you can follow the instructions at https://github.com/nebrius/raspi-io/wiki/Getting-a-Raspberry-Pi-ready-for-NodeBots.

## 2. Configure the local WiFi as a Raver Lights access point

Follow the instructions at http://www.raspberryconnect.com/network/item/333-raspberry-pi-hotspot-access-point-dhcpcd-method. Recent versions of Raspbian have changed things a bit, so you'll also need to run these instructions after you followed everything in the article.

Set the SSID to `RaverLights`, and ask @nebrius for the WPA passphrase to set in hostapd.conf.

```bash
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl start hostapd
```

We have one last thing to do. We never use IPv6 (the ESP8266s don't support it), but it can get in the way of the startup services from determining if we have a valid IP address or not. So we need to disable it. Edit `/etc/sysctl.conf` and add the following to the bottom:

```
net.ipv6.conf.all.disable_ipv6 = 1
```

Once this is done, reboot the Raspberry Pi. Make sure that you can see the WiFi AP using your laptops WiFi.

## 3. Set up the code

Clone and configure the project:

```bash
git clone https://github.com/nebrius/azure-led-booth.git
cd azure-led-booth/device
npm install
```

## 4. Create the system service

Here we'll create a System D service so that the code starts on startup. Start by creating a file at `/etc/systemd/system/raver-lights.service` with the following contents:

```
[Unit]
Requires=systemd-networkd.socket
After=systemd-networkd.socket

[Service]
ExecStartPre=/lib/systemd/systemd-networkd-wait-online --interface=wlan0 --interface=eth0
ExecStart=/usr/bin/node /home/pi/azure-led-booth/device/dist/index.js
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=raver-lights
User=srv-raver-lights
Group=srv-raver=lights
Environment=NODE_ENV=production
User=root

[Install]
WantedBy=multi-user.target
```

Note: you may need to change `eth0` above to `wlan0` if the Raspberry Pi is connected to the internet via a second WiFi adapter instead of Ethernet.

After you've created the above file, run these commands to enable the service:

```
sudo systemctl enable systemd-networkd-wait-online.service
sudo systemctl enable raver-lights
```

Now the service won't _quite_ work yet, because it's expecting some environment variables to be set. We're going to do this by creating a service override. Run:

```bash
systemctl edit raver-lights
```

This will open up a text editor. Enter in the following text.

```
[Service]
Environment="IOT_HUB_DEVICE_CONNECTION_STRING=[connection string from portal]"
Environment="RAVER_LIGHTS_INTERFACE=wlan0"
```

Reboot and the system should be up and running! To double check that the service is working, run `journalctl -u raver-lights.service` to see the application longs and ensure there are no errors.
