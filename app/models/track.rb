class Track < ActiveRecord::Base
	has_many :marker
	accepts_nested_attributes_for :marker, allow_destroy: true
	validates :name, presence: true,
			  length: {maximum: 200}
  	validates :gpx, presence: true, 
  			  length: {maximum: 255}
	validates :description, length: {maximum: 255}

end
