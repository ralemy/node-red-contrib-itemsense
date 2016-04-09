# Samples for Node-RED-contrib-itemsense

Two types of samples are provided. 

First are the library functions that are used often, These are in <code>lib/functions/itemsense</code> and you can copy them into your User Library directory for reuse.
In a typical node-red installations, the user directory contains a lib directory, and that contains a functions directory where these functions are placed. 


Then there are sample flows that demonstrate how to connect
to ItemSense and perform each action.

# How to use samples:

In your Admin UI, add a new Flow, and select Import from Clipboard from the menu.

Paste the contents of <code>all-samples.json</code> file.

This will add a number of tabs that contain examples of how each node could be used.

Finally, go to the Connect and Run Job nodes on the flow and add your Itemsense
instance information. 

**Note:** when creating your Itemsense instance, use the global context so you 
 don't have to define it for each flow. When you use the global context, 
 you only have to update the Connect and Run Job nodes in other flows to use 
 that global instance.

**Note:** the Itemsense Url is usually in the format of <code>http://[your-server-url]/itemsense</code>
many times users forget to add a trailing <code>/itemsense</code> to the url.


