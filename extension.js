
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {



	function getSettingValue(setName)
	{
		var emulatorPath = vscode.workspace.getConfiguration('millforkx16').get(setName, 'Name');
		return emulatorPath;         
	}

	function GetX6Toolkit()
	{

		var locationUri = 'https://raw.githubusercontent.com/Ambez05/MillforkX16Toolkit/master/VSExtensionList.txt';

		//Show the Milfork Console
		millfork.show();


		try
		{
			var curFile = vscode.window.activeTextEditor.document.fileName
		} catch(err) 

		{
			millfork.appendLine('No open Text Editor , Could not set download location!')
			return
		}

		
		var onlyPath = require('path').dirname(curFile);
		
		var downloadFileSync = require('download-file-sync');
		var content = downloadFileSync(locationUri);
		var array = content.split("\n");
		var fs = require('fs');

		millfork.appendLine('Got Toolkit Resource File List');

		//We have a string with the files to download.  Now lets split this string and save these files
		//We will need to overwrite any existing items
		for(let line of array) {
			if (line.trim() != '')
			{
				locationUri = `https://raw.githubusercontent.com/Ambez05/MillforkX16Toolkit/master/${line}`
				content = downloadFileSync(locationUri);
				var path = `${onlyPath}/${line}`
				fs.writeFileSync(path,content)	

				millfork.appendLine(`Millfork X16 Download : ${line}`)
			}
		}

		millfork.appendLine('Completed Millfork X16 Toolkit Download');

	}

	function RunMillfork(ExecuteEMU)
	{

		//Check that we should execute
		let currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName;

		//Show the Milfork Console
		millfork.show();

		//Overide source file
		let argSourceOver = getSettingValue("OptionsSourceOverride");
		
		if (argSourceOver.trim() != "")
		{
			currentlyOpenTabfilePath = argSourceOver;
		}

		//Get extension this must be mfk
		let openEXT = '';
		try {openEXT = currentlyOpenTabfilePath.split('.').pop()} catch(err) {};
		if (openEXT.toUpperCase() != 'MFK')
		{
			millfork.appendLine('A Non Millfork source file was selected');
			return;
		}

		//Create the outpuyt file name - this willbe deleted latter
		let detName = currentlyOpenTabfilePath.replace(".mfk",".prg");

		//Save all documents if option is selected
		if (getSettingValue('OptionsSaveOnBuild'))
		{
			vscode.workspace.saveAll(true);
		}

		
	

		//Build command line to be something like this
		//c:\data\x16\millfork\millfork.exe  "c:\data\X16\Editor\test.mfk" -o test.prg -t x16_experimental -v
		let argComp = getSettingValue("Compiler");
		let argOptParams = getSettingValue("OptionsAdditionalParams");

		//Delete the file Target File
		var fs = require('fs');
		try {fs.unlinkSync(detName);} catch(err) {}

		//If File exists we should not compile as this will fail
		if (fs.existsSync(detName)) {
			millfork.appendLine('');
			millfork.appendLine('Locked Destination File - Compile Aborted');
			millfork.appendLine('');
			return;
		}
		
		//Included additional include directories if stipulated
		let argOptionInDirs = getSettingValue("OptionsIncludeDirectory");
		let optIncludDir = "";
		if (argOptionInDirs.trim() != "")
		{
			optIncludDir = `-i ${argOptionInDirs}`;
		}

		//Build the ARGS fror the Compile
		let argMilPlatformType = getSettingValue("OptionsMillforkPlatformTarget");
		let mArgs = `\"${argComp}\" \"${currentlyOpenTabfilePath}\" -o \"${detName}\" ${argOptParams} ${optIncludDir} -t ${argMilPlatformType}`;
		let mOverMil = getSettingValue("ReplaceMillforkCommand");
		if (mOverMil.trim() != "")
		{
			mArgs = `\"${argComp}\" {mOverMil}`;
		}
		

		millfork.clear();
		millfork.show();
		millfork.appendLine('ARGS: ' + mArgs);
		millfork.appendLine('');

		//Start the Build and capture output
		const cp = require('child_process')
		cp.exec(mArgs, (err, stdout, stderr) => {
			millfork.append(stdout);
			if (stderr == "")
			{
				millfork.appendLine('');
				millfork.appendLine('Compile Completed Sucessfully');
				millfork.appendLine('');


				//Now if we are ment to run the emulator lets do this
				if (ExecuteEMU)
				{
					let argEmuPath = getSettingValue("EmulatorX16");

					mArgs = `\"${argEmuPath}\" -prg \"${detName}\"`;

					let mOverX16Emu = getSettingValue("ReplaceX16EmuCommand");
					if (mOverX16Emu.trim() != "")
					{
						mArgs = `\"${argEmuPath}\" {mOverX16Emu}`;
					}

					millfork.appendLine('X16 Emulator ARGS : ' + mArgs);
					millfork.appendLine('');
					
					const spawnSync = require("child_process");
					spawnSync.exec(mArgs);
				}
			}
			else
			{
				millfork.appendLine('Compile Error');
				millfork.appendLine('');
				millfork.append(stderr);
				return;
			}
		});

	}

	function INT_ScaneFiles()
	{
		let dir = ""
		
		//Lets get the fields from Millfork - If this directory is configued
		var fs = require('fs');
		dir = getSettingValue("Compiler");
		var path = require('path');
		dir = path.dirname(dir);
		dir = dir + "include\\"
		var files = fs.readdirSync(dir);
		
		for(let file of files) {
			if (file.toLocaleLowerCase().includes(".mfk") && file.toLocaleLowerCase().includes("x16"))
			{
				var file_Path = dir + file;
				INT_ScanFile(file_Path);
			}
		}

		//Scan all MFK files in the current Directory

		//Scan all MFK files in the Include Directories 
	}

	function INT_ScanFile(FileName)
	{
		var fs = require('fs');
		var contents = fs.readFileSync(FileName).toString();
		var lines = contents.split('\n');
		
		
		for(let line of lines) {
			//const int24 VERA_SPRITES = $40800
			var re = /const\s+([\S]+)\s+([\S]+)\s+=\s+([\S]+)\s*$/;
			var myArray = re.exec(line);

			//First match is the whole string
			if (myArray != null && myArray.length > 1)
			{
				CompItems[myArray[2]] = `Value ${myArray[3]} Type ${myArray[1]}`;
			}


			/*
			inline void vera_poke(int24 address, byte value) {
			inline void vera_poke (int24 address, byte value) {
			inline byte vera_poke (int24 address, byte value) {
			void vera_upload_large(int24 address, pointer source, word size)
			inline void vera_fill(int24 address, byte value, word size) {
			inline asm void set_ram_bank(byte a) {
			asm void read_also_joy1() {
			asm void read_also_joy2() {
			void x16_joy_byte0(byte value) {
			asm void set_vera_layer_internal(pointer.vera_layer_setup ax, byte y) {
			void V_PutString(byte x1,byte y1,byte x2,byte y2,byte color,byte newLineChar,word strWord)
			void V_SetArea(byte x1,byte y1,byte x2,byte y2,byte data,byte color)
			byte U_RandBetween(byte LoNum,byte HiNum)
			byte K_KeyboardGetState() {
			byte K_ModeGet() {
			*/
			re = /((|inline) *(asm)* *(|void|byte) ((\S+)\s*\(.*\)))/;
			var myArray = re.exec(line);

			//First match is the whole string
			if (myArray != null && myArray.length > 1)
			{
				CompItems[myArray[6]] = `${myArray[0]}`;
			}

			
			
		}
	}
	
	
		
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "commander-x16-emu" is now active!');
	
	let vscode = require("vscode");
	let millfork = vscode.window.createOutputChannel("Millfork X16");

	//Test Dictionary
	var CompItems = {}
	CompItems["Test1"] = "Desc_1";
	CompItems["Test2"] = "Desc_2";
	CompItems["Test3"] = "Desc_3";

	var commitCharItems = {}
	commitCharItems["con"] = {Name: "Con",Desc: "Desc1",Items: ["1","2","3"]};
	

	provider1 = vscode.languages.registerCompletionItemProvider('mfk', {

		provideCompletionItems(document, position, token, context) 
		{

			var items = []

			for(var key in CompItems) {
				var sC = new vscode.CompletionItem(key);
				sC.label = key;
				sC.documentation = CompItems[key]

				items.push(sC)
			}

			
			for(var key in commitCharItems) {
				var label =commitCharItems[key].Name;
				var cCC = new vscode.CompletionItem(label);
				cCC.commitCharacters = ['.'];
				cCC.documentation = commitCharItems[key].Desc;

				items.push(cCC);
			  }

		
			return items;
		}

	 })
	 
	 
	 provider2 = vscode.languages.registerHoverProvider('mfk', {
		provideHover(document, position, token) {
			const hoveredWord = document.getText(document.getWordRangeAtPosition(position));
			const mappedWord = "MyTest"

			const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);
			
			return new vscode.Hover({
				language: "mfk",
				value: "Hello Value " + word,
			});
		}
	});

	provider3 = vscode.languages.registerCompletionItemProvider(
		'mfk',
		{
			provideCompletionItems(document, position) {

				// get all text until the `position` and check if it reads `console.`
				// and if so then complete if `log`, `warn`, and `error`
				linePrefix = document.lineAt(position).text.substr(0, position.character);

				//var re = new RegExp("([a-zA-Z\_0-9]+)\\.");
				var re = /([a-zA-Z\_0-9]+)\./;
				var myArray = re.exec(linePrefix);

				//First match is the whole string
				if (myArray == null || myArray.length <= 1)
				{
					return undefined;
				}

				var key = myArray[1].toLocaleLowerCase();
				if (key in commitCharItems)
				{

					var items = []

					for (i = 0; i < commitCharItems[key].Items.length; i++) { 
						var itemName = commitCharItems[key].Items[i];
						var cCC = new vscode.CompletionItem(itemName,vscode.CompletionItemKind.Method);
		
						items.push(cCC);
					  }
	
					return items;
	
				}
				else
				{
					return undefined;
				}
			}
		},
		'.' // triggered whenever a '.' is being typed
	);


	INT_ScaneFiles();

	context.subscriptions.push(provider1);
	context.subscriptions.push(provider2);
	context.subscriptions.push(provider3);
	





	let f_build_run = vscode.commands.registerCommand('extension.build_and_run', function () {
		RunMillfork(true);
	});


	let f_build = vscode.commands.registerCommand('extension.build', function () {
		RunMillfork(false);
	});


	let f_x16toolkit = vscode.commands.registerCommand('extension.x16toolkit', function () {
		GetX6Toolkit();
	});

	context.subscriptions.push(f_build_run);
	context.subscriptions.push(f_build);
	context.subscriptions.push(f_x16toolkit);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
