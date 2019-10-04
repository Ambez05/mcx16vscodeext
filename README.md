## Millfork - Commander X16

This provied support for these systems.

#### Millfork Language and Build Support

A middle-level programming language targeting 6502-based, 8080-based and Z80-based microcomputers.

#### Commander X16 Emulator Support

An upcoming 8-Bit computer Designed by David Murray : The Commander X16™


## Requirements


##### Millfork
To use the Compiler features of Millfork you will need to download and installed the windows version of Millfork.  This can be downloaded from : https://github.com/KarolS/millfork/releases.

Documentation for this language can be found at : https://millfork.readthedocs.io/en/latest/

##### Commanded X16 Emulator

For the Emulator to be launched with the build program that Commander X16 Emulator must be installed.  This can be downloaded from : https://github.com/commanderx16/x16-emulator/releases

**Notes**
* Only Windows is currently being tested.

## Commands


**Millfork: X16 Build**
* Run the Millfork Compiler 

**Millfork: X16 Build and Run**
* Run the Millfork Compiler and then the X16 Emulator

**Notes**
* All commands will output results to Output stream called Millfork: X16
* If the Compile fails the Emulator will not be started
* Before Compile is started the Target file is deleted
* The Target file name defaults to .PRG.  Eg TestGame.mfk -> TestGame.prg
* Source files must be named *.mfk

## Extension Settings


This extension contributes the following settings:

* `Compiler`: The Full Path including the executable to to Millfork Compiler.
* `Emulator X16`: The Full Path including the executable to to X16 Emulator.
* `Options Save On Build`: Save all open files prior to the Build.
* `Options Source Override`: If you want to use a fixed file to compile with include the full path of this file here.
* `Options Include Directory`: Additional Include Directories
* `Options Additional Params`: Any optional paramteres to Millfork
* `Options Millfork Platform Target`: The Platform Target for Millfork.
* `Replace Millfork Command`: Override the command string passed to Milfork.  This Does not included the Executable Name.
* `Replace X16 Emu Command`: Override the command string passed to X16EMU.  This Does not included the Execute Name.


## Known Issues

None

