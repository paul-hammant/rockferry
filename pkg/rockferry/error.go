package rockferry

type Error string

const (
	ErrorBadArguments      Error = "bad arguments were provided"
	ErrorNotFound          Error = "resource not found"
	ErrorUnexpectedResults Error = "unexpected results"
	ErrorStreamClosed      Error = "stream closed"
)

func (e Error) Error() string {
	return string(e)
}
