# Running as a service on Mac

If you want to have the node-red installation run at boot time, without
you having to run it each time, all you have to do is to copy the
shell file and the plist files provided there to the right place.

```bash
$ cp itemsense-red.sh /usr/local/bin
$ chmod a+x /usr/local/bin/itemsense-red.sh
$ cp com.impinj.itemsense-red.plist ~/Library/LaunchAgents
$ launchctl load ~/Library/LaunchAgents/com.impinj.itemsense-red.plist
```

The log output will be placed in <code>/usr/local/var/log/itemsense-red.log</code>

If you ever wanted to remove the service, you issue the following command

```bash
$ launchctl unload ~/Library/LaunchAgents/com.impinj.itemsense-red.plist
```

