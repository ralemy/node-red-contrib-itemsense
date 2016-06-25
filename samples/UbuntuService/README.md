# Running as a systemd service in Ubuntu Xenial

Make a directory for the settings.js file (in the root directory of this repo), and copy it there

```bash
$ sudo mkdir -p /usr/local/share/node-red/impinj
$ sudo chmod -R a+rwx /usr/local/share/node-red
$ sudo cp -fr /usr/local/lib/node_modules/node-red-contrib-itemsense/settings.js /usr/local/share/node-red
$ sudo cp -fr /usr/local/lib/node_modules/node-red-contrib-itemsense/impinj /usr/local/share/node-red
```

Make a user for the systemd service

```bash
$ sudo useradd -mrU node-red-service
```

Create a service file for node-red.itemsense

```bash
$ sudo cp -fr /usr/local/lib/node_modules/node-red-contrib-itemsense/samples/UbuntuService/itemsense-red.service /lib/systemd/system/
```

Enable and start the service

```bash
$ sudo systemctl enable itemsense-red
$ sudo systemctl start itemsense-red
```

if you wanted to look at the logs for the service:

```bash
$ sudo journalctl -u itemsense-red
```

and if you wanted to stop the service:

```bash
$ sudo systemctl stop itemsense-red
```

