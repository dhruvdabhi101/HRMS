type Props = {
	className?: string;
};

export const LoadingScreen = (props: Props) => {
	return (
		<div
			className={`flex h-full w-full items-center justify-center ${props.className ?? ""}`}
		>
			<div className="relative inline-flex h-12 w-12 items-center justify-center">
				<div className="bg-primary/20 absolute inset-0 animate-ping rounded-full"></div>
				<div className="bg-primary relative h-6 w-6 rounded-full"></div>
			</div>
		</div>
	);
};
