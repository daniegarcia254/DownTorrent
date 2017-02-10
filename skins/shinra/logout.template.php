<?php defined("NET2FTP") or die("Direct access to this location is not allowed."); ?>
<!-- Template /skins/shinra/logout.php begin -->

	<!-- WRAPPER -->
	<div id="wrapper">
			
		<!-- HEADER -->
		<div id="header">
			<h1><span>danigarcia-dev.com</span> FTP client</h1>
		</div>
		<!-- ENDS HEADER -->
			
		<!-- MAIN -->
		<div id="main">

			<!-- content -->
			<div id="content">
				
				<!-- title -->
				<div id="page-title">
				</div>
				<!-- ENDS title -->

				<!-- Posts -->
				<div id="posts">

					<!-- post -->
					<div class="post">
						<p><?php echo __("You have logged out from the FTP server. To log back in, <a href=\"%1\$s\" title=\"Login page (accesskey l)\" accesskey=\"l\">follow this link</a>.", $url); ?></p>
						<p><?php echo __("Note: other users of this computer could click on the browser's Back button and access the FTP server."); ?></p>
						<p><?php echo __("To prevent this, you must close all browser windows."); ?></p>
					</div>
					<!-- ENDS post -->
			
				</div>
				<!-- ENDS Posts -->

<?php require_once($net2ftp_globals["application_skinsdir"] . "/" . $net2ftp_globals["skin"] . "/google_ad_bottom.template.php"); ?>

<?php require_once($net2ftp_globals["application_skinsdir"] . "/" . $net2ftp_globals["skin"] . "/footer.template.php"); ?>

<!-- Template /skins/shinra/logout.php end -->
