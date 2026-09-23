import { NextResponse } from "next/server"
import { noStoreHeaders } from "./gorut/server"
import { mapGorutCollectionError } from "./gorut-collection-api-pure"

export {
  assertGorutCollectionApiMutationAllowed,
  executeGorutCollectionApiAction,
} from "./gorut-collection-action-server"

export function gorutCollectionErrorResponse(error: unknown) {
  const mapped = mapGorutCollectionError(error)
  return NextResponse.json(mapped.body, { status: mapped.status, headers: noStoreHeaders })
}
