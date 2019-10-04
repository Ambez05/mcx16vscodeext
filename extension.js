const vscode = require('vscode');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {


	function getSettingValue(setName)
	{
		var emulatorPath = vscode.workspace.getConfiguration('millforkx16').get(setName, 'Name');
		return emulatorPath;         
	}

	function RunMillfork(ExecuteEMU)
	{

		//Check that we should execute
		let currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName;

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
		

		//Included additional include directories if stipulated
		let argOptionInDirs = getSettingValue("OptionsIncludeDirectory");
		let optIncludDir = "";
		if (argOptionInDirs.trim() != "")
		{
			optIncludDir = `-i ${argSourceOver}`;
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
					if (mOverMil.trim() != "")
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
	
	
		
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "commander-x16-emu" is now active!');
	
	let vscode = require("vscode");
	let millfork = vscode.window.createOutputChannel("Millfork X16");


	let f_build_run = vscode.commands.registerCommand('extension.build_and_run', function () {
		RunMillfork(true);
	});


	let f_build = vscode.commands.registerCommand('extension.build', function () {
		RunMillfork(false);
	});

	context.subscriptions.push(f_build_run);
	context.subscriptions.push(f_build);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
