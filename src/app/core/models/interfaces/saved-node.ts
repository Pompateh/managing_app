export interface SavedNode {
  x: number,
  y: number,
	width: number | null,
	height: number | null,
	color: string | null,
	innerText: string | null,
	type: string,
	id: string,
	imageSrc?: string | null,
	createdByUserId?: string,
	createdByRole?: string
}
