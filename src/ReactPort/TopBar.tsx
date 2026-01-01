type TopBarProps = {
	statusText?: string;
};

export function TopBar({ statusText = "Not logged in" }: TopBarProps) {
	return (
		<header className="top-bar">
			<a id="homeLink" href="#">
				<img id="logoImage" src="../assets/play-logo.png" width="40" height="40"></img>
				<div className="logo">
					stefan play (v0.1)
				</div>
			</a>
			<div className="login-status">{statusText}</div>
		</header>
	);
}
