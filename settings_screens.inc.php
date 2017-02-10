<?php

//   -------------------------------------------------------------------------------
//  |                  net2ftp: a web based FTP client                              |
//  |              Copyright (c) 2003-2013 by David Gartner                         |
//  |                                                                               |
//   -------------------------------------------------------------------------------
//  |                                                                               |
//  |  Enter your settings and preferences below.                                   |
//  |                                                                               |
//  |  The structure of each line is like this:                                     |
//  |     $net2ftp_settings["setting_name"] = "setting_value";                      |
//  |                                                                               |
//  |  BE CAREFUL WHEN EDITING THE FILE: ONLY EDIT THE setting_value, AND DO NOT    |
//  |  ERASE THE " OR THE ; CHARACTERS.                                             |
//   -------------------------------------------------------------------------------


// ----------------------------------------------------------------------------------
// Functions on the Browse screen - TOP LEFT
// Indicate which functions are enabled or disabled
// ----------------------------------------------------------------------------------

// Create new directory
$net2ftp_settings["functionuse_newdir"] = "no";

// Create new file
$net2ftp_settings["functionuse_newfile"] = "no";

// Upload (upload, upload-and-unzip)
$net2ftp_settings["functionuse_upload"] = "no";

// Java upload
$net2ftp_settings["functionuse_jupload"] = "no";

// Create a website from pre-made HTML templates
$net2ftp_settings["functionuse_easyWebsite"] = "no";

// Bookmark a page
$net2ftp_settings["functionuse_bookmark"] = "no";

// Install functions
$net2ftp_settings["functionuse_install"] = "no";

// Advanced functions
$net2ftp_settings["functionuse_advanced"] = "no";


// ----------------------------------------------------------------------------------
// Functions on the Browse screen - TOP RIGHT
// Indicate which functions are enabled or disabled
// ----------------------------------------------------------------------------------

// Copy, move and delete directories and files
$net2ftp_settings["functionuse_copy"]   = "no";
$net2ftp_settings["functionuse_move"]   = "no";
$net2ftp_settings["functionuse_delete"] = "no";

// Rename
$net2ftp_settings["functionuse_rename"] = "no";

// Chmod
$net2ftp_settings["functionuse_chmod"] = "no";

// Zip-and-download
$net2ftp_settings["functionuse_downloadzip"] = "no";

// Unzip
$net2ftp_settings["functionuse_unzip"] = "no";

// Zip-and-save, zip-and-email
$net2ftp_settings["functionuse_zip"] = "no";

// Calculate size
$net2ftp_settings["functionuse_calculatesize"] = "no";

// Find string
$net2ftp_settings["functionuse_findstring"] = "no";


// ----------------------------------------------------------------------------------
// Functions on the Browse screen - ROW LEVEL
// Indicate which functions are enabled or disabled
// ----------------------------------------------------------------------------------

// Download file
$net2ftp_settings["functionuse_downloadfile"] = "yes";

// View file
$net2ftp_settings["functionuse_view"] = "no";

// Edit file
$net2ftp_settings["functionuse_edit"] = "no";

// Update file (beta function)
$net2ftp_settings["functionuse_update"] = "no";

// Open file 
$net2ftp_settings["functionuse_open"] = "no";

?>
