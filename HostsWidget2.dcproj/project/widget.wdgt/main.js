/** HostsWidget2 : Manipulates your /etc/hosts file for development purposes. 

	Daniel Jimenez (daniel.j.jimenez@gmail.com) - October 2009
	Benjamin Timms (ben.timms@gmail.com) - March 2008
	
	This is a fork of Benjamin Timm's HostsWidget V1.1.

    DISCLAIMER: This computer program is supplied "AS IS".
    The Author disclaims all warranties, expressed or implied, including,
    without limitation, the warranties of merchantability and of fitness
    for  any purpose.  The Author assumes no liability for direct, indirect,
    incidental, special, exemplary, or consequential damages, which may
    result from the use of the computer program, even if advised of the
    possibility of such damage.  There is no warranty against interference
    with your enjoyment of the computer program or against infringement.
    There is no warranty that my efforts or the computer program will
    fulfill any of your particular purposes or needs.  This computer
    program is provided with all faults, and the entire risk of satisfactory
    quality, performance, accuracy, and effort is with the user.

    LICENSE: Permission is hereby irrevocably granted to everyone to use,
    copy, modify, and distribute this computer program, or portions hereof,
    purpose, without payment of any fee, subject to the following
    restrictions:

    1. The origin of this binary or source code must not be misrepresented.

    2. Altered versions must be plainly marked as such and must not be
    misrepresented as being the original binary or source.

    3. The Copyright notice, disclaimer, and license may not be removed
    or altered from any source, binary, or altered source distribution.
*/


var loaded		= false;
var maxId		= -1;
var alt			= false;
var debug		= false;
var ipRegExp	= /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
var badPermissions = false;

function $(id) {
	return document.getElementById(id);
}

function pdb(message)
{
    if (debug)
    {
        window.console.log(message);
    }
}

function trim(aString) 
{
     return aString.replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
}

function outHandler(currentStringOnStdout)
{
    // Code that does something with the commandÔøΩs current output like...
    document.getElementById("hostsText").innerHTML = currentStringOnStdout;
}

//
// Function: load()
// Called by HTML body element's onload event when the widget is ready to start
//
function load()
{
	permissionTest();
	if (loaded == false) hostsLoad();
    dashcode.setupParts();
}

//
// Function: remove()
// Called when the widget has been removed from the Dashboard
//
function remove()
{
    // Stop any timers to prevent CPU usage
    // Remove any preferences as needed
    // widget.setPreferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
}

//
// Function: hide()
// Called when the widget has been hidden
//
function hide()
{
    // Stop any timers to prevent CPU usage
}

//
// Function: show()
// Called when the widget has been shown
//
function show()
{
	if (badPermissions) showBack();
    // Restart any timers that were stopped on hide
}

//
// Function: sync()
// Called when the widget has been synchronized with .Mac
//
function sync()
{
    // Retrieve any preference values that you need to be synchronized here
    // Use this for an instance key's value:
    // instancePreferenceValue = widget.preferenceForKey(null, dashcode.createInstancePreferenceKey("your-key"));
    //
    // Or this for global key's value:
    // globalPreferenceValue = widget.preferenceForKey(null, "your-key");
}

//
// Function: showBack(event)
// Called when the info button is clicked to show the back of the widget
//
// event: onClick event from the info button
//
function showBack(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToBack");
    }

    front.style.display = "none";
    back.style.display = "block";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

//
// Function: showFront(event)
// Called when the done button is clicked from the back of the widget
//
// event: onClick event from the done button
//
function showFront(event)
{
    var front = document.getElementById("front");
    var back = document.getElementById("back");

    if (window.widget) {
        widget.prepareForTransition("ToFront");
    }

    front.style.display="block";
    back.style.display="none";

    if (window.widget) {
        setTimeout('widget.performTransition();', 0);
    }
}

if (window.widget) {
    widget.onremove = remove;
    widget.onhide = hide;
    widget.onshow = show;
    widget.onsync = sync;
}

function removeAllChildNodes(node) 
{
    if (node && node.hasChildNodes && node.removeChild) 
    {
        while (node.hasChildNodes()) 
        {
            node.removeChild(node.firstChild);
        }
    }
}

function getChildText(linkNode)
{
    linkChildren = linkNode.childNodes;

    var result = '';
    for (i = 0; i < linkChildren.length; i++) 
    {
         linkChild = linkChildren.item(i);

         if (linkChild.nodeType == Node.TEXT_NODE) 
         {
                result = result + linkChild.nodeValue;
         }
    }
    return result;
}

function endHandler()
{
    pdb("Done!");
}

function editHostname(hostId)
{
    pdb("Editing hostname " + hostId);
    
    nodeSpan = document.getElementById('hw_host_' + hostId);
    nodeSpan.parentNode.setAttribute("onclick", null);
	
	var form			= document.createElement("form");
	var hostField		= document.createElement("input");
	var oldHostField	= document.createElement("input");
	var hostIdField		= document.createElement("input");
	
	form.setAttribute("id", "hostnameEdit" + hostId);
	form.setAttribute("onSubmit", "return false;");
	
	//Editable fields
	hostField.setAttribute("class", "hostField");
	hostField.setAttribute("id", "hostname");
	hostField.setAttribute("name", "hostname");
	hostField.setAttribute("onBlur", "javascript:saveHostname(this.form); return false;");
	hostField.value = getChildText(nodeSpan);
	
	//Hidden fields
	oldHostField.setAttribute("id", "oldHostname");
	oldHostField.setAttribute("name", "oldHostname");
	oldHostField.setAttribute("type", "hidden");
	oldHostField.value = getChildText(nodeSpan);
	hostIdField.setAttribute("id", "hostID");
	hostIdField.setAttribute("name", "hostID");
	hostIdField.setAttribute("type", "hidden");
	hostIdField.value = hostId;
	
	form.appendChild(hostField);
	form.appendChild(oldHostField);
	form.appendChild(hostIdField);
	
	nodeSpan.innerText = '';
	nodeSpan.appendChild(form);
	
	hostField.addEventListener("keypress", keyPressedInEditHostnameForm, true, ipField);
	hostField.focus();
}

function editIP(hostId)
{
    pdb("Editing IP " + hostId);
    
	nodeSpan = document.getElementById('hw_ip_' + hostId);
    nodeSpan.parentNode.setAttribute("onClick", null);
    
    ipAddress = getChildText(nodeSpan);
    
	var form		= document.createElement("form");
	var ipField		= document.createElement("input");
	var oldIPField	= document.createElement("input");
	var hostIdField	= document.createElement("input");

	form.setAttribute("id", "ipEdit" + hostId);
	form.setAttribute("onSubmit", "return false;");
	
	//Editable fields
	ipField.setAttribute("class", "ipField");
	ipField.setAttribute("id", "ipField");
	ipField.setAttribute("name", "ipField");
	ipField.setAttribute("size", "15");
	ipField.setAttribute("onBlur", "javascript:saveIP(this.form); return false;");
	ipField.value = ipAddress;
	
	//Hidden Fields
	oldIPField.setAttribute("id", "oldIPField");
	oldIPField.setAttribute("name", "oldIPField");
	oldIPField.setAttribute("type", "hidden");
	oldIPField.value = ipAddress;
	hostIdField.setAttribute("id", "hostID");
	hostIdField.setAttribute("name", "hostID");
	hostIdField.setAttribute("type", "hidden");
	hostIdField.value = hostId;
	
	form.appendChild(ipField);
	form.appendChild(oldIPField);
	form.appendChild(hostIdField);
	
	nodeSpan.innerText = '';
	nodeSpan.appendChild(form);
	
	ipField.addEventListener("keypress", keyPressedInEditIPForm, true, ipField);
	ipField.focus();
}

function toggleHost(hostId)
{
	document.getElementById("frontSpinner").style.visibility = "visible";
	document.getElementById("backSpinner").style.visibility = "visible";
    pdb("Toggling: " + hostId);
    nodeSpan = document.getElementById('hw_enabled_' + hostId);
    nodeSpan.setAttribute("dirty", "yes");
    doHostsSave();
}

function saveIP(formObj)
{
	pdb("Saving: " + formObj['hostID'].value);
	dirty		= false;
	hostId		= formObj['hostID'].value;
	ipField		= formObj['ipField'].value;
	oldIPField	= formObj['oldIPField'].value;

	nodeSpan = document.getElementById('hw_ip_' + hostId);
    nodeSpan.parentNode.setAttribute("onclick", "javascript:editIP("+hostId+"); return false;");

    if ( (ipField != oldIPField))
    { 
        pdb("Dirty!!");
        nodeSpan.setAttribute("dirty", "yes");
        dirty = true;
    }
    nodeSpan.innerHTML = ipField;
    if (dirty) doHostsSave();
}

function saveHostname(formObj)
{
    pdb("Saving: " + formObj['hostname'].value);
    var dirty = false;
    hostId      = formObj['hostID'].value;
    hostname    = formObj['hostname'].value;
    oldHostname = formObj['oldHostname'].value;
    
    nodeSpan = document.getElementById('hw_host_' + hostId);
    nodeSpan.parentNode.setAttribute("onclick", "javascript:editHostname("+hostId+"); return false;");
    if (oldHostname != hostname)
    {
        pdb("Dirty!!");
        nodeSpan.setAttribute("dirty", "yes");
        dirty = true;
    }
    nodeSpan.innerHTML = hostname;
    if (dirty) doHostsSave();
}

function addNewHost()
{
    var newHostName = document.getElementById('addHostField');
    var newIPField1 = document.getElementById('newIPField1');
    var hostnameRegExp = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?$/;
    
    pdb("Adding host: " + newHostName.value + " - '" + newIPField1.value + "'");
	
	var isValidHostname = hostnameRegExp.test(newHostName.value);
    if (!isValidHostname)
    {
        pdb("Invalid Hostname field");
        newHostName.className = 'warn';
        newHostName.focus();
        return;
    } else
		{
			newHostName.className = 'hostField';
		}
	
	var isValidIPAddress = ipRegExp.test(newIPField1.value);
	if (!isValidIPAddress) {
		pdb("Invalid IP Address" + newIPField1);
		newIPField1.className = 'warn';
        newIPField1.focus();
        return;
	} else
		{
			newIPField1.className = '';
		}
	var hostTable  = document.getElementById("hostsTable");
	var addHostRow = document.getElementById("addHostRow");
	maxId = maxId + 1;
	var ipAddress =  newIPField1.value;
	var newRow = getHostRowNode(maxId, newHostName.value, ipAddress, false, true, "yes");
	alt = !alt;
	hostsData = hostsData + ipAddress + "\t\t" + newHostName.value + " #hw" + maxId + "\n"; 
	hostTable.insertBefore(newRow, addHostRow);
	doHostsSave();
	pdb("All OK!");

    newHostName.value = '';
    newIPField1.value = '';
    newHostName.focus();
}

function permissionTest()
{
    window.console.log("Permission test !");
    document.getElementById("frontSpinner").style.visibility = "visible";
    document.getElementById("backSpinner").style.visibility = "visible";
    permissionTestCmd = widget.system("/usr/bin/touch /etc/hosts", permissionTestDone);
    permissionTestCmd.onreaderror = commandError;
}

function doHostsSave()
{
	document.getElementById("frontSpinner").style.visibility = "visible";
    document.getElementById("backSpinner").style.visibility = "visible";
    pdb("Saving hosts!");
    var hostLines = hostsData.split(/[\n\r]/g);
    for (var i=0; i < hostLines.length; i++)
    {
        hostLines[i] = hostLines[i].replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
        var hostLine = hostLines[i].split(/\s+/);
        hostActive		= true;
        hostDisabled	= true;
        hostId			= -1;
        if ((hostLine.length == 2) || (hostLine.length == 3))
        {
            if (hostLine[0].charAt(0) == "#")
            {
                hostActive = false; 
                hostLine[0] = hostLine[0].substring(1);
            }
            // Check for valid IP addresses
            if (!ipRegExp.test(hostLine[0]))
            {
                continue;
            }
            
            if (hostLine.length == 3)
            {
                if (hostLine[2].indexOf("#hw") > -1)
                {
                     hostId = eval(hostLine[2].substring(3));
                     pdb("Checking host... " + hostId);
                     hostDisabled = false;
                     // See if this host is dirty.
                     ipNode = document.getElementById('hw_ip_' + hostId);
                     hostNode = document.getElementById('hw_host_' + hostId);
                     enabledNode = document.getElementById('hw_enabled_' + hostId);
                     
                     pdb("Is the IP dirty? " + ipNode.attributes.getNamedItem('dirty').value);
                     pdb("Is the hostname dirty? " + hostNode.attributes.getNamedItem('dirty').value);
                     
                     if ((ipNode.attributes.getNamedItem('dirty').value == 'yes') ||
                         (enabledNode.attributes.getNamedItem('dirty').value == 'yes') ||
                         (hostNode.attributes.getNamedItem('dirty').value == 'yes'))
                     {
                         pdb("Altering dirty host..");
                         
                         hostLines[i] = (enabledNode.value == 'on'  ? '' : '#')  + 
                                        getChildText(ipNode) + " " + 
                                        getChildText(hostNode) + " " + 
                                        "#hw"+ hostId;
                         ipNode.setAttribute('dirty', 'no');
                         hostNode.setAttribute('dirty', 'no');
                     }
                }
            }
        }
    }
    widget.system("echo '" + trim(hostLines.join("\n")) + "' > /tmp/hosts", null);
    
    osxVersion = widget.system("/usr/bin/sw_vers", null).outputString;
	if (osxVersion.indexOf("10.6") > -1)
    {
        pdb("Detected 10.6...");
        command = widget.system("/bin/cat /tmp/hosts > /etc/hosts; dscacheutil -flushcache", commandDone);
		command.onreaderror = commandError;
    }
    else if (osxVersion.indexOf("10.5") > -1)
    {
        pdb("Detected 10.5...");
        command = widget.system("/bin/cat /tmp/hosts > /etc/hosts; dscacheutil -flushcache", commandDone);
		command.onreaderror = commandError;
    }
    else if (osxVersion.indexOf("10.4") > -1)
    {
        pdb("Detected 10.4...");
        command = widget.system("/bin/cat /tmp/hosts > /etc/hosts; lookupd -flushcache", commandDone);
		command.onreaderror = commandError;
    }
    else
    {
        pdb("Unable to detect OS version..");
    }
    
}

function commandError(stderr){
	window.console.log(stderr);
}

function commandDone(cmd)
{
	pdb("/etc/hosts successfully updated!");
	document.getElementById('frontSpinner').style.visibility = "hidden";
    document.getElementById('backSpinner').style.visibility = "hidden";
}

function permissionTestDone(cmd)
{
    pdb("Permission test done...");
    document.getElementById('frontSpinner').style.visibility = "hidden";
    document.getElementById('backSpinner').style.visibility = "hidden";
    if(cmd.status == 0){
		permissionPass();
    }else if(cmd.status == 1){
		permissionFail();
    }
}

function permissionPass()
{
	$('permissionsIndicator').object.setValue(1);
	$('errorDiv').innerText = 'Permission test passed!';
	$('fixPermissions').style.visibility = "hidden";
	badPermissions = false;
	hostsLoad();
}

function permissionFail()
{
	badPermissions = true;
	hostsLoad();
	$('addHostField').disabled	= true;
	$('newIPField1').disabled	= true;
	var tableRows = $('hostsTable').children;
	$('permissionsIndicator').object.setValue(15);
	$('errorDiv').innerText = 'Permission test failed';
	$('fixPermissions').style.visibility = "visible";
}

function getHostRowNode(hostId, hostname, ipAddress, hostDisabled, hostActive, dirty)
{
	if (badPermissions) hostDisabled = true;
    var mycurrent_row = document.createElement("tr");
	if (alt && !hostDisabled) mycurrent_row.setAttribute("class", "hostsTableAlt");
    var mycurrent_cell = document.createElement("td");
    mycurrent_cell.setAttribute("id", "checkBoxCell");
    var current_text = document.createElement("input");
    current_text.setAttribute("id", "hw_enabled_"+hostId);
    current_text.setAttribute("dirty", dirty);
    current_text.setAttribute("type", "checkbox");
    current_text.setAttribute("onclick", "javascript:toggleHost("+hostId+");");
    if (hostDisabled) current_text.setAttribute("disabled", "true");
    if (hostActive) current_text.setAttribute("checked", "checked");
    mycurrent_cell.appendChild(current_text);
    mycurrent_row.appendChild(mycurrent_cell);
	mycurrent_cell = document.createElement("td");
	mycurrent_cell.setAttribute("id", "hostnameCell");
	if (!hostDisabled) mycurrent_cell.setAttribute("onclick", "javascript:editHostname("+hostId+"); return false;");
	mycurrent_span = document.createElement("span");
	if (hostId > -1)
	{
		mycurrent_span.setAttribute("dirty",dirty);
		mycurrent_span.setAttribute("id", "hw_host_"+hostId);
		mycurrent_span.setAttribute("title", "Click here to edit this hostname");
	}
	else
	{
		mycurrent_span.setAttribute("id", "disabledHostText");
		mycurrent_span.setAttribute("title", "This host is not editable.");
	}
	if (badPermissions) mycurrent_span.setAttribute("id", "disabledHostText");
	current_text = document.createTextNode(hostname);
	mycurrent_span.appendChild(current_text);
	mycurrent_cell.appendChild(mycurrent_span);
	mycurrent_row.appendChild(mycurrent_cell);
	

    mycurrent_cell = document.createElement("td");
    mycurrent_cell.setAttribute("id", "ipAddrCell");
	if (!hostDisabled) mycurrent_cell.setAttribute("onclick", "javascript:editIP("+hostId+"); return false;");
    mycurrent_span = document.createElement("span");
    if (hostId > -1)
    {
        mycurrent_span.setAttribute("dirty", dirty);
        mycurrent_span.setAttribute("id", "hw_ip_"+hostId);
        mycurrent_span.setAttribute("title", "Click to edit this IP address");
    }
    else
    {
        mycurrent_span.setAttribute("id", "disabledHostText");
        mycurrent_span.setAttribute("title", "This IP is not editable.");
    }
	if (badPermissions) mycurrent_span.setAttribute("id", "disabledHostText");
    current_text = document.createTextNode(ipAddress);
    mycurrent_span.appendChild(current_text);
    mycurrent_cell.appendChild(mycurrent_span);
    mycurrent_row.appendChild(mycurrent_cell);
    return mycurrent_row;
}

function hostsLoad()
{
    pdb("Loading hosts!");
    
    // Read the data from the existing hosts file and store it in a global for later. 
    hostsData = widget.system("/bin/cat /etc/hosts", null).outputString;
    
    // Split the results into lines
    var hostLines = hostsData.split(/[\n\r]/g);
    
    // Get a handle to the table
    var hostTable = document.getElementById("hostsTable");
    
    // Empty it out.
    removeAllChildNodes(hostTable);
    
    for (var i=0; i < hostLines.length; i++)
    {
        hostLines[i] = hostLines[i].replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
        var hostLine = hostLines[i].split(/\s+/);
        var hostActive = true;
        var hostDisabled = true;
        var hostId     = -1;
        
        if ((hostLine.length == 2) || (hostLine.length == 3))
        {
            pdb("Hostline: " + hostLine);
            
            // Validate the elements.
            
            // Check for disabled hosts.
            if (hostLine[0].charAt(0) == "#")
            {
                hostActive = false; 
                hostLine[0] = hostLine[0].substring(1);
            }
            // Check for valid IP addresses
            if (!ipRegExp.test(hostLine[0]))
            {
                pdb("Invalid IP : " + hostLine[0]);
                continue;
            }
            
            if (hostLine.length == 3)
            {
                if (hostLine[2].indexOf("#hw") > -1)
                {
                     hostId = eval(hostLine[2].substring(3));
                     if (hostId > maxId)
                     {
                         maxId = hostId;
                     }
                     hostDisabled = false;
                }
                else
                {
                    pdb("Strangeness.. we got " + hostLine[3]);
                }
            }
            
            mycurrent_row = getHostRowNode(hostId, hostLine[1], hostLine[0], hostDisabled, hostActive, "no");
            hostsTable.appendChild(mycurrent_row);
            
            alt = !alt;
        }
    }
    
    // Create the row for the "new host" form.
    mycurrent_row = document.createElement("tr");
    // Mark it, so we can get back to it later.
    mycurrent_row.setAttribute("id", "addHostRow");
    // Create the blank cell (where the checkbox would normally be)
    mycurrent_cell = document.createElement("td");
	if (alt) mycurrent_cell.setAttribute("class", "hostsTableNew");
    mycurrent_row.appendChild(mycurrent_cell);
    // Create the cell for the hostname
    mycurrent_cell = document.createElement("td");
	if (alt) mycurrent_cell.setAttribute("class", "hostsTableNew");
    // Create the form for the hostname
    add_form = document.createElement("form");
    add_form.setAttribute("onsubmit", "javascript:addNewHost(this); return false;");
    // Create the input for the hostname and add it to the form.
    hostField = document.createElement("input");
    hostField.setAttribute("class", "hostField");
    hostField.setAttribute("id", "addHostField");
    add_form.appendChild(hostField);
    // Add the form to the cell
    mycurrent_cell.appendChild(add_form);
    // Add the Cell to the row
    mycurrent_row.appendChild(mycurrent_cell);
    // Create the cell for the IP address
    mycurrent_cell = document.createElement("td");
	if (alt) mycurrent_cell.setAttribute("class", "hostsTableNew");
    // Create the form for the hostname
	add_form = document.createElement("form");
	add_form.setAttribute("onsubmit", "javascript:addNewHost(this); return false;");
	// Create the input for an IP address field
	ipField = document.createElement("input");
	ipField.setAttribute("name", "ipField1");
	ipField.setAttribute("id", "newIPField1");
	ipField.setAttribute("size", "15");
	add_form.appendChild(ipField);
    // Add the form to the cell    
    mycurrent_cell.appendChild(add_form);
    // Finally add the IP address cell to the row    
    mycurrent_row.appendChild(mycurrent_cell);
    // And add the row to the table
    hostsTable.appendChild(mycurrent_row);
    loaded = true;
}

function keyPressedInEditIPForm(evt)
{
	if (evt.keyCode == 9) // tab key
	{
		saveIP(this.form);
		handled = true;
	}
	
	if (evt.keyCode == 13 || evt.keyCode == 3) // return or enter
	{
		this.blur();
		handled = true;
	}
	
	if (evt.keyCode == 27)
	{
		this.value = this.form['oldIPField'].value;
		saveIP(this.form);
	}
}

function keyPressedInEditHostnameForm(evt)
{
	if (evt.keyCode == 9) // tab key
	{
		saveHostname(this.form);
		handled = true;
	}
	
	if (evt.keyCode == 13 || evt.keyCode == 3) // return or enter
	{
		this.blur();
		handled = true;
	}
	
	if (evt.keyCode == 27)
	{
		this.value = this.form['oldHostname'].value;
		saveHostname(this.form);
	}
}

function fixPermissions(event)
{
	widget.system("/usr/bin/sudo -K",null);
	fixPermissions = widget.system("export SUDO_ASKPASS='macos-askpass.sh'; /usr/bin/sudo -A /usr/sbin/chown root:admin /etc/hosts; /usr/bin/sudo -A /bin/chmod g+rw /etc/hosts;", fixPermissionsDone);
	fixPermissions.onreaderror = commandError;
}

function fixPermissionsDone(cmd)
{
	window.console.log('Fix permissions completed.');
	permissionTest();
}