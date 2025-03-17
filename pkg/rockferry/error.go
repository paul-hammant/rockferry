package rockferry

type Error string

const (
	ErrorBadArguments        Error = "bad arguments were provided"
	ErrorNotFound            Error = "resource not found"
	ErrorUnexpectedResults   Error = "unexpected results"
	ErrorStreamClosed        Error = "stream closed"
	ErrorInternalServerError Error = "internal server error"
)

func (e Error) Error() string {
	return string(e)
}
