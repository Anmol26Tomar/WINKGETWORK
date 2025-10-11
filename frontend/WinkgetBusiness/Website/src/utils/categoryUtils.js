// Utility helpers to work with category -> subcategory -> secondarySubcategory mapping
// Built on top of the existing categories definition file

import {rawCategories} from '../utils/categories.js'

// Normalize the categories data into fast lookup maps
const categoryNameToNode = new Map()
for (const node of rawCategories) {
	if (node && typeof node.category === 'string') {
		categoryNameToNode.set(node.category, node)
	}
}

function limitToTen(list) {
	if (!Array.isArray(list)) return []
	return list.slice(0, 10)
}

export function getSubcategories(categoryName) {
	const categoryNode = categoryNameToNode.get(categoryName)
	if (!categoryNode) return []
	const subcats = Array.isArray(categoryNode.subcategories) ? categoryNode.subcategories : []
	// Return up to 10 subcategories as strings (names)
	return limitToTen(
		subcats
			.map(sc => (typeof sc?.name === 'string' ? sc.name : null))
			.filter(Boolean)
	)
}

export function getSecondarySubcategories(categoryName, subcategoryName) {
	const categoryNode = categoryNameToNode.get(categoryName)
	if (!categoryNode || !subcategoryName) return []
	const subcats = Array.isArray(categoryNode.subcategories) ? categoryNode.subcategories : []
	const subNode = subcats.find(sc => sc?.name === subcategoryName)
	const seconds = Array.isArray(subNode?.secondarySubcategories) ? subNode.secondarySubcategories : []
	return limitToTen(seconds)
}

export function hasCategory(categoryName) {
	return categoryNameToNode.has(categoryName)
}

export function getAllCategories() {
	return Array.from(categoryNameToNode.keys())
}

export default {
	getSubcategories,
	getSecondarySubcategories,
	hasCategory,
	getAllCategories,
}


